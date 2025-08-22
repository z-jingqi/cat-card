#!/usr/bin/env python3
"""
精灵图生成工具
支持多种布局算法和输出格式，可生成对应的CSS/JSON映射文件
"""

import os
import sys
import json
from pathlib import Path
import logging
from PIL import Image
from typing import List, Tuple, Dict, Optional
import math

# =============================================================================
# 配置区域 - 修改这里的参数来自定义精灵图生成行为
# =============================================================================

# 精灵图配置
SPRITE_CONFIG = {
    # 布局算法
    'layout_algorithm': 'grid',  # 'grid', 'bin_packing', 'horizontal', 'vertical'
    
    # 网格布局参数
    'grid_columns': 4,           # 网格列数 (仅grid模式)
    'grid_rows': None,           # 网格行数 (None=自动计算)
    
    # 画布设置
    'max_width': 2048,           # 最大宽度
    'max_height': 2048,          # 最大高度
    'padding': 2,                # 图片间距
    'background_color': (0, 0, 0, 0),  # 背景颜色 (R, G, B, A)
    
    # 图片处理
    'resize_images': False,      # 是否统一调整图片大小
    'target_size': (64, 64),     # 目标尺寸 (仅当resize_images=True)
    'keep_aspect_ratio': True,   # 保持宽高比
    
    # 输出设置
    'output_format': 'PNG',      # 输出格式 PNG/JPEG
    'quality': 95,               # JPEG质量 (1-100)
    'generate_css': True,        # 生成CSS文件
    'generate_json': True,       # 生成JSON映射文件
    'css_class_prefix': 'sprite-',  # CSS类名前缀
}

# 输入配置
INPUT_CONFIG = {
    # 输入目录列表 - 支持多个文件夹
    'input_directories': [
        'assets/images/cats',
        'assets/images/items',
        # 可以添加更多目录
        # 'assets/images/backgrounds',
        # 'assets/images/ui',
    ],
    
    # 输出配置
    'output_directory': 'assets/sprite_sheets',
    'sprite_filename_template': '{folder_name}_sprite',  # 文件名模板，{folder_name}会被替换为文件夹名
    
    # 文件过滤
    'supported_formats': {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'},
    'sort_files': True,          # 按文件名排序
    
    # 多文件夹处理选项
    'process_all_folders': True,  # 是否处理所有文件夹
    'skip_empty_folders': True,   # 是否跳过空文件夹
}

# 日志配置
LOG_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(levelname)s - %(message)s'
}

# 设置日志
logging.basicConfig(level=getattr(logging, LOG_CONFIG['level']), format=LOG_CONFIG['format'])
logger = logging.getLogger(__name__)

class SpriteGenerator:
    """精灵图生成器"""
    
    def __init__(self):
        self.images = []
        self.image_info = []
        
    def load_images(self, input_dir: str) -> bool:
        """加载图片文件"""
        input_path = Path(input_dir)
        if not input_path.exists():
            logger.error(f"输入目录不存在: {input_dir}")
            return False
        
        # 收集图片文件
        image_files = set()
        for ext in INPUT_CONFIG['supported_formats']:
            # 使用不区分大小写的模式匹配
            image_files.update(input_path.glob(f'*{ext}'))
            # 如果扩展名是小写，也查找大写版本
            if ext.islower():
                image_files.update(input_path.glob(f'*{ext.upper()}'))
        
        # 转换为列表并排序
        image_files = sorted(list(image_files))
        
        if not image_files:
            logger.error(f"在目录 {input_dir} 中没有找到支持的图片文件")
            return False
        
        logger.info(f"找到 {len(image_files)} 个图片文件")
        
        # 加载图片
        for img_file in image_files:
            try:
                img = Image.open(img_file)
                
                # 处理图片
                if SPRITE_CONFIG['resize_images']:
                    img = self._resize_image(img, SPRITE_CONFIG['target_size'])
                
                # 确保图片有alpha通道
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                self.images.append(img)
                self.image_info.append({
                    'filename': img_file.stem,
                    'original_path': str(img_file),
                    'size': img.size
                })
                
                logger.debug(f"加载图片: {img_file.name} ({img.size[0]}x{img.size[1]})")
                
            except Exception as e:
                logger.warning(f"无法加载图片 {img_file}: {e}")
        
        logger.info(f"成功加载 {len(self.images)} 张图片")
        return len(self.images) > 0
    
    def _resize_image(self, img: Image.Image, target_size: Tuple[int, int]) -> Image.Image:
        """调整图片大小"""
        if not SPRITE_CONFIG['keep_aspect_ratio']:
            return img.resize(target_size, Image.LANCZOS)
        
        # 保持宽高比
        img_ratio = img.width / img.height
        target_ratio = target_size[0] / target_size[1]
        
        if img_ratio > target_ratio:
            # 图片更宽，以宽度为准
            new_width = target_size[0]
            new_height = int(target_size[0] / img_ratio)
        else:
            # 图片更高，以高度为准
            new_height = target_size[1]
            new_width = int(target_size[1] * img_ratio)
        
        resized = img.resize((new_width, new_height), Image.LANCZOS)
        
        # 创建目标大小的画布，居中放置
        canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
        x = (target_size[0] - new_width) // 2
        y = (target_size[1] - new_height) // 2
        canvas.paste(resized, (x, y))
        
        return canvas
    
    def generate_sprite_sheet(self) -> Optional[Dict]:
        """生成精灵图"""
        if not self.images:
            logger.error("没有加载任何图片")
            return None
        
        algorithm = SPRITE_CONFIG['layout_algorithm']
        
        if algorithm == 'grid':
            return self._generate_grid_layout()
        elif algorithm == 'horizontal':
            return self._generate_horizontal_layout()
        elif algorithm == 'vertical':
            return self._generate_vertical_layout()
        elif algorithm == 'bin_packing':
            return self._generate_bin_packing_layout()
        else:
            logger.error(f"不支持的布局算法: {algorithm}")
            return None
    
    def _generate_grid_layout(self) -> Dict:
        """网格布局"""
        cols = SPRITE_CONFIG['grid_columns']
        rows = SPRITE_CONFIG['grid_rows'] or math.ceil(len(self.images) / cols)
        padding = SPRITE_CONFIG['padding']
        
        # 计算每个格子的大小（使用最大的图片尺寸）
        max_width = max(img.width for img in self.images)
        max_height = max(img.height for img in self.images)
        
        # 计算精灵图总尺寸
        sprite_width = cols * max_width + (cols - 1) * padding
        sprite_height = rows * max_height + (rows - 1) * padding
        
        # 检查尺寸限制
        if sprite_width > SPRITE_CONFIG['max_width'] or sprite_height > SPRITE_CONFIG['max_height']:
            logger.warning(f"精灵图尺寸 ({sprite_width}x{sprite_height}) 超过限制")
        
        # 创建精灵图
        sprite = Image.new('RGBA', (sprite_width, sprite_height), SPRITE_CONFIG['background_color'])
        
        # 放置图片并记录位置
        positions = []
        for i, (img, info) in enumerate(zip(self.images, self.image_info)):
            col = i % cols
            row = i // cols
            
            x = col * (max_width + padding)
            y = row * (max_height + padding)
            
            # 居中放置图片
            center_x = x + (max_width - img.width) // 2
            center_y = y + (max_height - img.height) // 2
            
            sprite.paste(img, (center_x, center_y), img)
            
            positions.append({
                'name': info['filename'],
                'x': center_x,
                'y': center_y,
                'width': img.width,
                'height': img.height,
                'grid_x': x,
                'grid_y': y,
                'grid_width': max_width,
                'grid_height': max_height
            })
        
        return {
            'sprite': sprite,
            'positions': positions,
            'layout': 'grid',
            'total_size': (sprite_width, sprite_height),
            'grid_size': (max_width, max_height),
            'grid_dimensions': (cols, rows)
        }
    
    def _generate_horizontal_layout(self) -> Dict:
        """水平布局"""
        padding = SPRITE_CONFIG['padding']
        
        # 计算总宽度和最大高度
        total_width = sum(img.width for img in self.images) + padding * (len(self.images) - 1)
        max_height = max(img.height for img in self.images)
        
        # 创建精灵图
        sprite = Image.new('RGBA', (total_width, max_height), SPRITE_CONFIG['background_color'])
        
        # 放置图片
        positions = []
        current_x = 0
        
        for img, info in zip(self.images, self.image_info):
            y = (max_height - img.height) // 2  # 垂直居中
            sprite.paste(img, (current_x, y), img)
            
            positions.append({
                'name': info['filename'],
                'x': current_x,
                'y': y,
                'width': img.width,
                'height': img.height
            })
            
            current_x += img.width + padding
        
        return {
            'sprite': sprite,
            'positions': positions,
            'layout': 'horizontal',
            'total_size': (total_width, max_height)
        }
    
    def _generate_vertical_layout(self) -> Dict:
        """垂直布局"""
        padding = SPRITE_CONFIG['padding']
        
        # 计算最大宽度和总高度
        max_width = max(img.width for img in self.images)
        total_height = sum(img.height for img in self.images) + padding * (len(self.images) - 1)
        
        # 创建精灵图
        sprite = Image.new('RGBA', (max_width, total_height), SPRITE_CONFIG['background_color'])
        
        # 放置图片
        positions = []
        current_y = 0
        
        for img, info in zip(self.images, self.image_info):
            x = (max_width - img.width) // 2  # 水平居中
            sprite.paste(img, (x, current_y), img)
            
            positions.append({
                'name': info['filename'],
                'x': x,
                'y': current_y,
                'width': img.width,
                'height': img.height
            })
            
            current_y += img.height + padding
        
        return {
            'sprite': sprite,
            'positions': positions,
            'layout': 'vertical',
            'total_size': (max_width, total_height)
        }
    
    def _generate_bin_packing_layout(self) -> Dict:
        """装箱算法布局（简单版本）"""
        # 简单的装箱算法实现
        padding = SPRITE_CONFIG['padding']
        max_width = SPRITE_CONFIG['max_width']
        
        # 按高度排序图片（降序）
        sorted_items = sorted(
            zip(self.images, self.image_info),
            key=lambda x: x[0].height,
            reverse=True
        )
        
        # 装箱
        bins = []  # 每个bin是一行
        positions = []
        
        for img, info in sorted_items:
            placed = False
            
            # 尝试放入现有的bin
            for bin_info in bins:
                if bin_info['current_width'] + img.width + padding <= max_width:
                    # 可以放入这个bin
                    x = bin_info['current_width']
                    y = bin_info['y']
                    
                    positions.append({
                        'name': info['filename'],
                        'x': x,
                        'y': y,
                        'width': img.width,
                        'height': img.height
                    })
                    
                    bin_info['current_width'] += img.width + padding
                    bin_info['max_height'] = max(bin_info['max_height'], img.height)
                    bin_info['images'].append((img, x, y))
                    placed = True
                    break
            
            if not placed:
                # 创建新的bin
                y = sum(bin_info['max_height'] + padding for bin_info in bins)
                
                new_bin = {
                    'y': y,
                    'current_width': img.width + padding,
                    'max_height': img.height,
                    'images': [(img, 0, y)]
                }
                bins.append(new_bin)
                
                positions.append({
                    'name': info['filename'],
                    'x': 0,
                    'y': y,
                    'width': img.width,
                    'height': img.height
                })
        
        # 计算总尺寸
        total_width = max(bin_info['current_width'] for bin_info in bins) if bins else 0
        total_height = sum(bin_info['max_height'] + padding for bin_info in bins) - padding if bins else 0
        
        # 创建精灵图
        sprite = Image.new('RGBA', (total_width, total_height), SPRITE_CONFIG['background_color'])
        
        # 放置所有图片
        for bin_info in bins:
            for img, x, y in bin_info['images']:
                sprite.paste(img, (x, y), img)
        
        return {
            'sprite': sprite,
            'positions': positions,
            'layout': 'bin_packing',
            'total_size': (total_width, total_height),
            'bins_count': len(bins)
        }
    
    def save_sprite_sheet(self, sprite_data: Dict, output_dir: str, filename: str) -> bool:
        """保存精灵图和相关文件"""
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # 保存精灵图
            sprite_file = output_path / f"{filename}.{SPRITE_CONFIG['output_format'].lower()}"
            
            if SPRITE_CONFIG['output_format'].upper() == 'JPEG':
                # JPEG不支持透明度，需要转换
                rgb_sprite = Image.new('RGB', sprite_data['sprite'].size, (255, 255, 255))
                rgb_sprite.paste(sprite_data['sprite'], mask=sprite_data['sprite'].split()[-1])
                rgb_sprite.save(sprite_file, quality=SPRITE_CONFIG['quality'])
            else:
                sprite_data['sprite'].save(sprite_file, optimize=True)
            
            logger.info(f"精灵图已保存: {sprite_file}")
            
            # 生成CSS文件
            if SPRITE_CONFIG['generate_css']:
                css_file = output_path / f"{filename}.css"
                self._generate_css_file(sprite_data, css_file, sprite_file.name)
                logger.info(f"CSS文件已生成: {css_file}")
            
            # 生成JSON文件
            if SPRITE_CONFIG['generate_json']:
                json_file = output_path / f"{filename}.json"
                self._generate_json_file(sprite_data, json_file, sprite_file.name)
                logger.info(f"JSON文件已生成: {json_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"保存精灵图失败: {e}")
            return False
    
    def _generate_css_file(self, sprite_data: Dict, css_file: Path, sprite_filename: str):
        """生成CSS文件"""
        css_content = [
            f"/* 精灵图CSS - 由sprite_generator.py自动生成 */",
            f"/* 精灵图文件: {sprite_filename} */",
            f"/* 布局: {sprite_data['layout']} */",
            f"/* 总尺寸: {sprite_data['total_size'][0]}x{sprite_data['total_size'][1]} */",
            "",
            f".{SPRITE_CONFIG['css_class_prefix']}base {{",
            f"    background-image: url('{sprite_filename}');",
            f"    background-repeat: no-repeat;",
            f"    display: inline-block;",
            f"}}",
            ""
        ]
        
        for pos in sprite_data['positions']:
            class_name = f"{SPRITE_CONFIG['css_class_prefix']}{pos['name']}"
            css_content.extend([
                f".{class_name} {{",
                f"    background-position: -{pos['x']}px -{pos['y']}px;",
                f"    width: {pos['width']}px;",
                f"    height: {pos['height']}px;",
                f"}}",
                ""
            ])
        
        with open(css_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(css_content))
    
    def _generate_json_file(self, sprite_data: Dict, json_file: Path, sprite_filename: str):
        """生成JSON映射文件"""
        json_data = {
            'meta': {
                'image': sprite_filename,
                'format': SPRITE_CONFIG['output_format'],
                'size': {
                    'w': sprite_data['total_size'][0],
                    'h': sprite_data['total_size'][1]
                },
                'layout': sprite_data['layout'],
                'generated_by': 'sprite_generator.py'
            },
            'frames': {}
        }
        
        for pos in sprite_data['positions']:
            json_data['frames'][pos['name']] = {
                'frame': {
                    'x': pos['x'],
                    'y': pos['y'],
                    'w': pos['width'],
                    'h': pos['height']
                },
                'rotated': False,
                'trimmed': False,
                'spriteSourceSize': {
                    'x': 0,
                    'y': 0,
                    'w': pos['width'],
                    'h': pos['height']
                },
                'sourceSize': {
                    'w': pos['width'],
                    'h': pos['height']
                }
            }
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)


def main():
    """主函数"""
    print("🎨 精灵图生成工具")
    print("="*50)
    
    # 显示配置信息
    print(f"📂 输出目录: {INPUT_CONFIG['output_directory']}")
    print(f"🎯 布局算法: {SPRITE_CONFIG['layout_algorithm']}")
    print(f"📏 最大尺寸: {SPRITE_CONFIG['max_width']}x{SPRITE_CONFIG['max_height']}")
    print(f"🔧 图片间距: {SPRITE_CONFIG['padding']}px")
    if SPRITE_CONFIG['layout_algorithm'] == 'grid':
        print(f"📊 网格设置: {SPRITE_CONFIG['grid_columns']} 列")
    print(f"📁 处理文件夹: {len(INPUT_CONFIG['input_directories'])} 个")
    print("="*50)
    
    # 统计信息
    total_processed = 0
    total_success = 0
    total_failed = 0
    
    # 处理每个文件夹
    for input_dir in INPUT_CONFIG['input_directories']:
        print(f"\n🔄 处理文件夹: {input_dir}")
        print("-" * 30)
        
        # 创建生成器
        generator = SpriteGenerator()
        
        # 加载图片
        if not generator.load_images(input_dir):
            if INPUT_CONFIG['skip_empty_folders']:
                logger.warning(f"跳过空文件夹: {input_dir}")
                continue
            else:
                logger.error(f"无法加载图片: {input_dir}")
                total_failed += 1
                continue
        
        total_processed += 1
        
        # 生成精灵图
        logger.info("开始生成精灵图...")
        sprite_data = generator.generate_sprite_sheet()
        
        if not sprite_data:
            logger.error("精灵图生成失败")
            total_failed += 1
            continue
        
        # 生成输出文件名
        folder_name = Path(input_dir).name
        sprite_filename = INPUT_CONFIG['sprite_filename_template'].format(folder_name=folder_name)
        
        # 保存文件
        success = generator.save_sprite_sheet(
            sprite_data,
            INPUT_CONFIG['output_directory'],
            sprite_filename
        )
        
        if success:
            print(f"✅ 完成: {folder_name}")
            print(f"📊 尺寸: {sprite_data['total_size'][0]}x{sprite_data['total_size'][1]}")
            print(f"🖼️ 图片: {len(sprite_data['positions'])} 张")
            total_success += 1
        else:
            logger.error("保存文件失败")
            total_failed += 1
    
    # 打印总结
    print("\n" + "="*50)
    print("🎉 批量精灵图生成完成!")
    print(f"📁 处理文件夹: {total_processed} 个")
    print(f"✅ 成功: {total_success} 个")
    print(f"❌ 失败: {total_failed} 个")
    print(f"💾 输出格式: {SPRITE_CONFIG['output_format']}")
    if SPRITE_CONFIG['generate_css']:
        print("📄 已生成CSS文件")
    if SPRITE_CONFIG['generate_json']:
        print("📋 已生成JSON映射文件")
    print("="*50)
    
    if total_failed > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
