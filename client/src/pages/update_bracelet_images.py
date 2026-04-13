#!/usr/bin/env python3
import re

with open('HomePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update remaining entries
replacements = {
    # 天然琥珀 - 黄色琥珀佛珠
    ("'天然琥珀': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n  ]"):
    ("'天然琥珀': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 黄水晶 - 金黄色水晶佛珠
    ("// 黄水晶 - 金黄色水晶\n  '黄水晶': [\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',\n  ]"):
    ("// 黄水晶 - 金黄色水晶佛珠\n  '黄水晶': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n  ]"),
    # 虎眼石 - 棕黄色虎眼石佛珠
    ("// 虎眼石 - 棕黄色宝石\n  '虎眼石': [\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',\n  ]"):
    ("// 虎眼石 - 棕黄色虎眼石佛珠\n  '虎眼石': [\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"),
    # 和田黄玉 - 黄色玉石佛珠
    ("// 和田黄玉 - 黄色玉石\n  '和田黄玉': [\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1598618443855-232ee0f819f6?w=400&h=400&fit=crop',\n  ]"):
    ("// 和田黄玉 - 黄色玉石佛珠\n  '和田黄玉': [\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n  ]"),
    # 天然蜜蜡 - 黄色蜜蜡佛珠
    ("// 天然蜜蜡 - 黄色蜜蜡\n  '天然蜜蜡': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n  ]"):
    ("// 天然蜜蜡 - 黄色蜜蜡佛珠\n  '天然蜜蜡': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 白水晶 - 透明水晶佛珠
    ("// 白水晶 - 透明水晶\n  '白水晶': [\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1598618443855-232ee0f819f6?w=400&h=400&fit=crop',\n  ]"):
    ("// 白水晶 - 透明水晶佛珠\n  '白水晶': [\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"),
    # 925纯银 - 银色金属佛珠
    ("// 925纯银 - 银色首饰\n  '925纯银': [\n    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751960706-9cc0f5b97e17?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"):
    ("// 925纯银 - 银色金属佛珠\n  '925纯银': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 金发晶 - 金黄色发晶佛珠
    ("// 金发晶 - 金黄色水晶\n  '金发晶': [\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n  ]"):
    ("// 金发晶 - 金黄色发晶佛珠\n  '金发晶': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 月光石 - 蓝白色月光石佛珠
    ("// 月光石 - 蓝白色宝石\n  '月光石': [\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',\n  ]"):
    ("// 月光石 - 蓝白色月光石佛珠\n  '月光石': [\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"),
    # 黑曜石 - 黑色黑曜石佛珠
    ("// 黑曜石 - 黑色宝石\n  '黑曜石': [\n    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n  ]"):
    ("// 黑曜石 - 黑色黑曜石佛珠\n  '黑曜石': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"),
    # 海蓝宝石 - 海蓝色海蓝宝佛珠
    ("// 海蓝宝石 - 海蓝色水晶\n  '海蓝宝石': [\n    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1598656778796-94e6aaeb0a81?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611652022419-a2f31b6b4b8d?w=400&h=400&fit=crop',\n  ]"):
    ("// 海蓝宝石 - 海蓝色海蓝宝佛珠\n  '海蓝宝石': [\n    'https://images.unsplash.com/photo-1598656778796-94e6aaeb0a81?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611652022419-a2f31b6b4b8d?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n  ]"),
    # 青金石 - 深蓝色青金石佛珠
    ("// 青金石 - 深蓝色宝石\n  '青金石': [\n    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611652022419-a2f31b6b4b8d?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1598656778796-94e6aaeb0a81?w=400&h=400&fit=crop',\n  ]"):
    ("// 青金石 - 深蓝色青金石佛珠\n  '青金石': [\n    'https://images.unsplash.com/photo-1611652022419-a2f31b6b4b8d?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1598656778796-94e6aaeb0a81?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n  ]"),
    # 黑玛瑙 - 黑色玛瑙佛珠
    ("// 黑玛瑙 - 黑色宝石\n  '黑玛瑙': [\n    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n  ]"):
    ("// 黑玛瑙 - 黑色玛瑙佛珠\n  '黑玛瑙': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 紫水晶
    ("'紫水晶': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n  ]"):
    ("'紫水晶': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 绿松石
    ("'绿松石': [\n    'https://images.unsplash.com/photo-1598656778796-94e6aaeb0a81?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611652022419-a2f31b6b4b8d?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',\n  ]"):
    ("'绿松石': [\n    'https://images.unsplash.com/photo-1598656778796-94e6aaeb0a81?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611652022419-a2f31b6b4b8d?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 蜜蜡
    ("'蜜蜡': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=400&fit=crop',\n  ]"):
    ("'蜜蜡': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 金曜石
    ("'金曜石': [\n    'https://images.unsplash.com/photo-1598618443855-232ee0f819f6?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617714651234-09a3a85a2e2b?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n  ]"):
    ("'金曜石': [\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 红玛瑙
    ("'红玛瑙': [\n    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"):
    ("'红玛瑙': [\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 南红
    ("'南红': [\n    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"):
    ("'南红': [\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 碧玺
    ("'碧玺': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n  ]"):
    ("'碧玺': [\n    'https://images.unsplash.com/photo-1599707367072-cd6ada2a3757?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',\n  ]"),
    # 兼容旧名称 - 和田玉
    ("'和田玉': [\n    'https://images.unsplash.com/photo-1598618443855-232ee0f819f6?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1603952886276-1e27e8e73c88?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',\n  ]"):
    ("'和田玉': [\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop',\n  ]"),
    # 默认图片 - 佛珠手串
    ("// 默认图片 - 水晶珠子\n  'default': [\n    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1598618443855-232ee0f819f6?w=400&h=400&fit=crop',\n  ]"):
    ("// 默认图片 - 佛珠手串\n  'default': [\n    'https://images.unsplash.com/photo-1608571423539-7e142e697563?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1617713964959-d9a36bbc7b52?w=400&h=400&fit=crop',\n    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop',\n  ]"),
}

count = 0
for old, new in replacements.items():
    if old in content:
        content = content.replace(old, new)
        count += 1
        print(f"Replaced: {old[:50]}...")
    else:
        print(f"Not found: {old[:50]}...")

with open('HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nTotal replacements: {count}")
