from django.urls import path

from . import views

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/', views.LoginView.as_view()),
    path('auth/logout/', views.LogoutView.as_view()),
    path('auth/me/', views.MeView.as_view()),
    path('auth/password-reset/', views.PasswordResetRequestView.as_view()),
    path('auth/password-reset/confirm/', views.PasswordResetConfirmView.as_view()),
    path('feed/', views.FeedView.as_view()),
    path('articles/', views.ArticleListView.as_view()),
    path('articles/mine/', views.MyArticlesView.as_view()),
    path('articles/editorial/', views.EditorialQueueView.as_view()),
    path('articles/<int:pk>/', views.ArticleDetailView.as_view()),
    path('articles/<int:pk>/submit/', views.SubmitArticleView.as_view()),
    path('articles/<int:pk>/publish/', views.PublishArticleView.as_view()),
    path('external-articles/<str:external_id>/', views.ExternalArticleDetailView.as_view()),
    path('comments/', views.CommentListView.as_view()),
    path('comments/<int:pk>/', views.CommentDetailView.as_view()),
    path('bookmarks/', views.BookmarkListView.as_view()),
    path('bookmarks/<int:pk>/', views.BookmarkDetailView.as_view()),
]
