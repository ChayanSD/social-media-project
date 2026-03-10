from django.contrib import admin
from .models import *

# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_approved', 'created_by', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at',)

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_approved', 'created_by', 'created_at')
    list_filter = ('is_approved', 'category', 'created_at')
    search_fields = ('name', 'category__name')
    readonly_fields = ('created_at',)

# admin.site.register(UserInterest)