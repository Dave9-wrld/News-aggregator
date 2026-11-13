from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Article, Bookmark, Comment, ExternalArticle, Profile


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    def get_role(self, user):
        # Staff and superusers already have editorial authority in the
        # permission layer, so the frontend must see the same effective role.
        if user.is_staff or user.is_superuser:
            return Profile.Role.EDITOR
        return getattr(getattr(user, 'profile', None), 'role', Profile.Role.READER)

    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = get_user_model().objects.create_user(password=password, **validated_data)
        return user


class ArticleSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True, default=0)
    bookmarked = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Article
        fields = ['id', 'title', 'body', 'cover_image', 'cover_image_file', 'category', 'author', 'status', 'created_at', 'updated_at', 'submitted_at', 'published_at', 'comment_count', 'bookmarked']
        read_only_fields = ['author', 'status', 'created_at', 'updated_at', 'submitted_at', 'published_at']

    def validate_cover_image_file(self, upload):
        if not upload:
            return upload
        if upload.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Cover images must be 5 MB or smaller.')
        content_type = getattr(upload, 'content_type', '')
        if content_type not in {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}:
            raise serializers.ValidationError('Upload a JPG, PNG, WebP, or GIF image.')
        return upload


class ExternalArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalArticle
        fields = ['external_id', 'provider', 'canonical_url', 'title', 'source_name', 'description', 'image_url', 'category', 'published_at']


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    article_id = serializers.IntegerField(source='article.id', read_only=True)
    external_id = serializers.CharField(source='external_article.external_id', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'body', 'user', 'article_id', 'external_id', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']


class BookmarkSerializer(serializers.ModelSerializer):
    article = ArticleSerializer(read_only=True)
    external_article = ExternalArticleSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'article', 'external_article', 'created_at']
