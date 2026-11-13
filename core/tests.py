from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient

from .models import Article, Bookmark, Comment, Profile
from .external_news import fetch_external_news


class ChronicleApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.reader = get_user_model().objects.create_user('reader', 'reader@example.com', 'passphrase123')
        self.author = get_user_model().objects.create_user('author', 'author@example.com', 'passphrase123')
        self.editor = get_user_model().objects.create_user('editor', 'editor@example.com', 'passphrase123')
        self.author.profile.role = Profile.Role.AUTHOR
        self.author.profile.save()
        self.reader.profile.role = Profile.Role.READER
        self.reader.profile.save()
        self.editor.profile.role = Profile.Role.EDITOR
        self.editor.profile.save()
        self.client = APIClient()
        self.draft = Article.objects.create(title='Draft dispatch', body='A sufficiently detailed draft story for editorial review.', category='world', author=self.author)

    def auth_as(self, user):
        self.client.force_authenticate(user=user)

    def test_registration_requires_a_separate_sign_in(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'new-reader',
            'email': 'new-reader@example.com',
            'password': 'strong-passphrase-123',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertNotIn('token', response.data)
        self.assertEqual(response.data['detail'], 'Account created. Please sign in.')
        self.assertEqual(response.data['user']['role'], Profile.Role.AUTHOR)

        login = self.client.post('/api/auth/login/', {
            'username': 'new-reader',
            'password': 'strong-passphrase-123',
        }, format='json')
        self.assertEqual(login.status_code, 200)
        self.assertIn('token', login.data)

    def test_only_authors_can_create_and_submit_own_drafts(self):
        self.auth_as(self.reader)
        denied = self.client.post('/api/articles/', {'title': 'Nope', 'body': 'A sufficiently long news article body.', 'category': 'general'}, format='json')
        self.assertEqual(denied.status_code, 403)

        self.auth_as(self.author)
        created = self.client.post('/api/articles/', {'title': 'My report', 'body': 'A sufficiently long original report written by an author.', 'category': 'business'}, format='json')
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data['status'], Article.Status.DRAFT)
        submitted = self.client.post(f"/api/articles/{created.data['id']}/submit/")
        self.assertEqual(submitted.status_code, 200)
        self.assertEqual(submitted.data['status'], Article.Status.SUBMITTED)

        self.auth_as(self.reader)
        denied_submit = self.client.post(f'/api/articles/{self.draft.id}/submit/')
        self.assertEqual(denied_submit.status_code, 403)

    def test_author_can_upload_a_cover_image(self):
        self.auth_as(self.author)
        cover = SimpleUploadedFile('cover.png', b'fake-png-content', content_type='image/png')
        response = self.client.post('/api/articles/', {
            'title': 'Illustrated report',
            'body': 'A sufficiently detailed original article with an uploaded cover image.',
            'category': 'science',
            'cover_image_file': cover,
        }, format='multipart')
        self.assertEqual(response.status_code, 201)
        article = Article.objects.get(pk=response.data['id'])
        self.assertTrue(article.cover_image_file.name.endswith('cover.png'))
        article.cover_image_file.delete(save=False)

    def test_editor_publishing_controls_visibility(self):
        self.auth_as(self.author)
        self.client.post(f'/api/articles/{self.draft.id}/submit/')
        hidden = self.client.get(f'/api/articles/{self.draft.id}/')
        self.assertEqual(hidden.status_code, 200)  # author can review their own submitted work

        self.client.force_authenticate(user=None)
        hidden = self.client.get(f'/api/articles/{self.draft.id}/')
        self.assertEqual(hidden.status_code, 404)

        self.auth_as(self.author)
        forbidden = self.client.post(f'/api/articles/{self.draft.id}/publish/')
        self.assertEqual(forbidden.status_code, 403)

        self.auth_as(self.editor)
        published = self.client.post(f'/api/articles/{self.draft.id}/publish/')
        self.assertEqual(published.status_code, 200)
        self.assertEqual(published.data['status'], Article.Status.PUBLISHED)

        self.client.force_authenticate(user=None)
        visible = self.client.get(f'/api/articles/{self.draft.id}/')
        self.assertEqual(visible.status_code, 200)

    def test_editorial_queue_is_editor_only(self):
        self.draft.status = Article.Status.SUBMITTED
        self.draft.save()
        self.auth_as(self.reader)
        self.assertEqual(self.client.get('/api/articles/editorial/').status_code, 403)
        self.auth_as(self.editor)
        response = self.client.get('/api/articles/editorial/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['id'], self.draft.id)

    def test_superuser_is_reported_as_editor(self):
        superuser = get_user_model().objects.create_superuser('chief', 'chief@example.com', 'passphrase123')
        self.auth_as(superuser)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['role'], Profile.Role.EDITOR)

    def test_comment_ownership_and_editor_moderation(self):
        self.draft.status = Article.Status.PUBLISHED
        self.draft.save()
        self.auth_as(self.reader)
        created = self.client.post('/api/comments/', {'kind': 'original', 'article_id': self.draft.id, 'body': 'Thoughtful reporting.'}, format='json')
        self.assertEqual(created.status_code, 201)
        comment_id = created.data['id']

        self.auth_as(self.author)
        denied = self.client.delete(f'/api/comments/{comment_id}/')
        self.assertEqual(denied.status_code, 403)

        self.auth_as(self.editor)
        removed = self.client.delete(f'/api/comments/{comment_id}/')
        self.assertEqual(removed.status_code, 204)
        self.assertFalse(Comment.objects.filter(pk=comment_id).exists())

    def test_bookmarks_support_original_and_stable_external_articles(self):
        self.draft.status = Article.Status.PUBLISHED
        self.draft.save()
        self.auth_as(self.reader)
        original = self.client.post('/api/bookmarks/', {'kind': 'original', 'article_id': self.draft.id}, format='json')
        self.assertEqual(original.status_code, 201)
        external_payload = {
            'kind': 'external',
            'external': {
                'external_id': 'ext_stable_reference',
                'provider': 'gnews',
                'url': 'https://example.com/report?utm_source=feed',
                'title': 'External report',
                'description': 'A provider description.',
                'source': {'name': 'Example News'},
                'category': 'world',
            },
        }
        external = self.client.post('/api/bookmarks/', external_payload, format='json')
        self.assertEqual(external.status_code, 201)
        duplicate = self.client.post('/api/bookmarks/', external_payload, format='json')
        self.assertEqual(duplicate.status_code, 200)
        self.assertEqual(Bookmark.objects.filter(user=self.reader).count(), 2)

    @patch('core.views.fetch_external_news', return_value=([], ['newsapi', 'gnews']))
    def test_external_api_failure_keeps_original_feed_available(self, _fetch):
        self.draft.status = Article.Status.PUBLISHED
        self.draft.save()
        response = self.client.get('/api/feed/?page=1&pageSize=15')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['provider_errors'], ['newsapi', 'gnews'])
        self.assertEqual(response.data['articles'][0]['kind'], 'original')

    @patch('core.views.fetch_external_news', return_value=([], []))
    def test_original_feed_pagination_does_not_repeat_page_one(self, _fetch):
        for index in range(7):
            Article.objects.create(
                title=f'Published {index}',
                body='A sufficiently detailed published story for pagination testing.',
                category='world',
                author=self.author,
                status=Article.Status.PUBLISHED,
            )
        page_one = self.client.get('/api/feed/?page=1&pageSize=5&category=world').data['articles']
        page_two = self.client.get('/api/feed/?page=2&pageSize=5&category=world').data['articles']
        self.assertTrue(page_one)
        self.assertTrue(page_two)
        self.assertTrue({item['id'] for item in page_one}.isdisjoint({item['id'] for item in page_two}))

    @patch('core.external_news._from_gnews')
    @patch('core.external_news._from_newsapi')
    def test_external_providers_are_combined(self, newsapi, gnews):
        newsapi.return_value = [{'external_id': 'newsapi-one', 'title': 'NewsAPI', 'url': 'https://newsapi.example/1'}]
        gnews.return_value = [{'external_id': 'gnews-one', 'title': 'GNews', 'url': 'https://gnews.example/1'}]
        articles, errors = fetch_external_news(query='', category='all', country='us', page=1, page_size=15)
        self.assertEqual(errors, [])
        self.assertEqual({article['external_id'] for article in articles}, {'newsapi-one', 'gnews-one'})
        newsapi.assert_called_once()
        gnews.assert_called_once()
