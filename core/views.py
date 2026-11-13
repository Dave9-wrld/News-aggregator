from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .external_news import fetch_external_news, persist_external_article
from .models import Article, Bookmark, Comment, ExternalArticle
from .permissions import is_author, is_editor
from .serializers import ArticleSerializer, BookmarkSerializer, CommentSerializer, RegistrationSerializer, UserSerializer


def _is_owner_or_editor(user, obj):
    return obj.user_id == user.id or is_editor(user)


def _original_feed_item(article, bookmarked_ids, request=None):
    cover_image = article.cover_image
    if article.cover_image_file:
        cover_image = article.cover_image_file.url
        if request:
            cover_image = request.build_absolute_uri(cover_image)
    return {
        'id': f'original-{article.id}',
        'kind': 'original',
        'article_id': article.id,
        'title': article.title,
        'description': article.body[:500],
        'content': article.body,
        'url': f'/article/original-{article.id}',
        'urlToImage': cover_image,
        'source': {'id': 'the-global-chronicle', 'name': 'The Global Chronicle'},
        'author': article.author.get_full_name() or article.author.username,
        'category': article.category,
        'publishedAt': article.published_at.isoformat() if article.published_at else article.created_at.isoformat(),
        'tag': 'The Global Chronicle • Original',
        'readTime': f"{max(1, round(len(article.body.split()) / 200))}m read",
        'comment_count': article.comment_count,
        'bookmarked': article.id in bookmarked_ids,
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'detail': 'Account created. Please sign in.', 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = authenticate(username=request.data.get('username', ''), password=request.data.get('password', ''))
        if not user:
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        # Return the same response to prevent account enumeration.
        for user in get_user_model().objects.filter(email__iexact=email, is_active=True):
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            url = f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}'
            send_mail('Reset your Global Chronicle password', f'Use this link to reset your password: {url}', None, [user.email])
        return Response({'detail': 'If an account exists for that email, reset instructions have been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user_id = force_str(urlsafe_base64_decode(request.data.get('uid', '')))
            user = get_user_model().objects.get(pk=user_id)
        except (ValueError, TypeError, OverflowError, get_user_model().DoesNotExist):
            user = None
        token, password = request.data.get('token', ''), request.data.get('password', '')
        if not user or not default_token_generator.check_token(user, token) or len(password) < 8:
            return Response({'detail': 'The reset link is invalid or the password is too short.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        Token.objects.filter(user=user).delete()
        return Response({'detail': 'Password reset complete. Please sign in.'})


class FeedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = min(30, max(1, int(request.query_params.get('pageSize', 15))))
        query = request.query_params.get('q', '').strip()
        category = request.query_params.get('category', 'all')
        country = request.query_params.get('country', 'us')

        originals = Article.objects.filter(status=Article.Status.PUBLISHED).select_related('author').annotate(comment_count=Count('comments'))
        if category and category != 'all':
            originals = originals.filter(category__iexact=category)
        if query:
            originals = originals.filter(Q(title__icontains=query) | Q(body__icontains=query))
        bookmarked_ids = set()
        if request.user.is_authenticated:
            bookmarked_ids = set(Bookmark.objects.filter(user=request.user, article__isnull=False).values_list('article_id', flat=True))
        external_bookmarks = set()
        if request.user.is_authenticated:
            external_bookmarks = set(Bookmark.objects.filter(user=request.user, external_article__isnull=False).values_list('external_article__external_id', flat=True))

        original_reserve = min(5, page_size)
        original_start = (page - 1) * original_reserve
        original_page = list(originals[original_start:original_start + original_reserve])
        external_limit = max(0, page_size - len(original_page))
        external, provider_errors, persisted = [], [], []
        if external_limit:
            external, provider_errors = fetch_external_news(
                query=query,
                category=category,
                country=country,
                page=page,
                page_size=external_limit,
            )
            persisted = [persist_external_article(item) for item in external]
        external_comments = dict(Comment.objects.filter(external_article__external_id__in=[x.external_id for x in persisted]).values('external_article__external_id').annotate(total=Count('id')).values_list('external_article__external_id', 'total'))

        items = [_original_feed_item(article, bookmarked_ids, request) for article in original_page]
        for item in external:
            item['bookmarked'] = item['external_id'] in external_bookmarks
            item['comment_count'] = external_comments.get(item['external_id'], 0)
            items.append(item)
        items.sort(key=lambda item: item.get('publishedAt') or '', reverse=True)
        items = items[:page_size]
        has_more = len(external) >= external_limit if external_limit else False
        has_more = has_more or originals.count() > original_start + len(original_page)
        return Response({'status': 'ok', 'source': 'django-feed', 'page': page, 'pageSize': page_size, 'hasMore': has_more, 'provider_errors': provider_errors, 'articles': items})


class ArticleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Article.objects.filter(status=Article.Status.PUBLISHED).select_related('author')
        return Response(ArticleSerializer(queryset, many=True).data)

    def post(self, request):
        if not is_author(request.user):
            return Response({'detail': 'Author role required.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ArticleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        article = serializer.save(author=request.user, status=Article.Status.DRAFT)
        return Response(ArticleSerializer(article).data, status=status.HTTP_201_CREATED)


class MyArticlesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_author(request.user):
            return Response({'detail': 'Author role required.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(ArticleSerializer(Article.objects.filter(author=request.user).select_related('author'), many=True).data)


class EditorialQueueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_editor(request.user):
            return Response({'detail': 'Editor role required.'}, status=status.HTTP_403_FORBIDDEN)
        queryset = Article.objects.filter(status=Article.Status.SUBMITTED).select_related('author')
        return Response(ArticleSerializer(queryset, many=True).data)


class ArticleDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, request, pk):
        article = get_object_or_404(Article.objects.select_related('author'), pk=pk)
        if article.status != Article.Status.PUBLISHED and article.author_id != getattr(request.user, 'id', None) and not is_editor(request.user):
            return None
        return article

    def get(self, request, pk):
        article = self.get_object(request, pk)
        if not article:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ArticleSerializer(article).data)

    def patch(self, request, pk):
        article = self.get_object(request, pk)
        if not article:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if article.author_id != request.user.id or article.status != Article.Status.DRAFT:
            return Response({'detail': 'Only the author may edit a draft.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ArticleSerializer(article, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        article = self.get_object(request, pk)
        if not article:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if article.author_id != request.user.id or article.status != Article.Status.DRAFT:
            return Response({'detail': 'Only the author may delete a draft.'}, status=status.HTTP_403_FORBIDDEN)
        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExternalArticleDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, external_id):
        article = get_object_or_404(ExternalArticle, external_id=external_id)
        bookmarked = request.user.is_authenticated and Bookmark.objects.filter(
            user=request.user,
            external_article=article,
        ).exists()
        return Response({
            'id': article.external_id,
            'external_id': article.external_id,
            'kind': 'external',
            'provider': article.provider,
            'source': {'id': article.provider, 'name': article.source_name or article.provider.title()},
            'title': article.title,
            'description': article.description,
            'content': article.description,
            'url': article.canonical_url,
            'urlToImage': article.image_url,
            'publishedAt': article.published_at.isoformat() if article.published_at else '',
            'category': article.category,
            'tag': f'{article.provider.upper()} • External',
            'readTime': 'External link',
            'bookmarked': bookmarked,
            'comment_count': article.comments.count(),
        })


class SubmitArticleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        article = get_object_or_404(Article, pk=pk)
        if article.author_id != request.user.id or article.status != Article.Status.DRAFT:
            return Response({'detail': 'Only the author may submit a draft.'}, status=status.HTTP_403_FORBIDDEN)
        article.status, article.submitted_at = Article.Status.SUBMITTED, timezone.now()
        article.save(update_fields=['status', 'submitted_at', 'updated_at'])
        return Response(ArticleSerializer(article).data)


class PublishArticleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_editor(request.user):
            return Response({'detail': 'Editor role required.'}, status=status.HTTP_403_FORBIDDEN)
        article = get_object_or_404(Article, pk=pk)
        if article.status != Article.Status.SUBMITTED:
            return Response({'detail': 'Only submitted articles can be published.'}, status=status.HTTP_400_BAD_REQUEST)
        article.status, article.published_at = Article.Status.PUBLISHED, timezone.now()
        article.save(update_fields=['status', 'published_at', 'updated_at'])
        return Response(ArticleSerializer(article).data)


def _target_from_payload(payload):
    kind = payload.get('kind')
    if kind == 'original':
        return {'article': get_object_or_404(Article, pk=payload.get('article_id'))}
    if kind == 'external':
        raw = payload.get('external') or {}
        if not raw.get('external_id') or not raw.get('url') or not raw.get('title'):
            return None
        return {'external_article': persist_external_article(raw)}
    return None


class CommentListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        article_id, external_id = request.query_params.get('article_id'), request.query_params.get('external_id')
        queryset = Comment.objects.select_related('user', 'article', 'external_article')
        if article_id:
            queryset = queryset.filter(article_id=article_id)
        elif external_id:
            queryset = queryset.filter(external_article__external_id=external_id)
        else:
            return Response({'detail': 'article_id or external_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CommentSerializer(queryset, many=True).data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        target = _target_from_payload(request.data)
        if not target:
            return Response({'detail': 'A valid article target is required.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(user=request.user, **target)
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Comment, pk=pk)

    def patch(self, request, pk):
        comment = self.get_object(pk)
        if not _is_owner_or_editor(request.user, comment):
            return Response({'detail': 'You cannot edit this comment.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CommentSerializer(comment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        comment = self.get_object(pk)
        if not _is_owner_or_editor(request.user, comment):
            return Response({'detail': 'You cannot remove this comment.'}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookmarkListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Bookmark.objects.filter(user=request.user).select_related('article__author', 'external_article')
        return Response(BookmarkSerializer(queryset, many=True).data)

    def post(self, request):
        target = _target_from_payload(request.data)
        if not target:
            return Response({'detail': 'A valid article target is required.'}, status=status.HTTP_400_BAD_REQUEST)
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, **target)
        return Response(BookmarkSerializer(bookmark).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class BookmarkDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        bookmark = get_object_or_404(Bookmark, pk=pk, user=request.user)
        bookmark.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
