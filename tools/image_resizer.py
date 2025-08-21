#!/usr/bin/env python3
"""
高质量图片缩放工具
支持单张图片或批量处理，提供多种缩放算法以获得最佳质量
"""

import os
import sys
from PIL import Image, ImageFilter, ImageEnhance
from pathlib import Path
import logging

# =============================================================================
# 配置区域 - 修改这里的参数来自定义缩放行为
# =============================================================================

# 缩放配置
RESIZE_CONFIG = {
    # 目标尺寸 - 支持多个尺寸
    # 格式: [(宽度1, 高度1), (宽度2, 高度2), ...]
    'target_sizes': [(256, 256), (128, 128)],  # 支持多个尺寸，为每个尺寸生成对应文件

    # 缩放算法 (质量从高到低: lanczos > bicubic > bilinear)
    'resize_method': 'lanczos',

    # 图片质量
    'jpeg_quality': 95,               # JPEG质量 (1-100, 越高越好)

    # 图像增强
    'enable_sharpen': True,           # 启用锐化 (推荐)
    'enable_enhance': True,           # 启用对比度增强 (推荐)

    # 高级设置
    'sharpen_radius': 0.5,
    'sharpen_percent': 50,
    'sharpen_threshold': 3,
    'contrast_factor': 1.05,
    'color_factor': 1.02,
    'progressive_scale_threshold': 0.5,
    
    # 文件命名
    'add_suffix_to_filename': True,  # 是否添加尺寸后缀 (如: image_256x256.jpg)
}

# 输入配置
INPUT_CONFIG = {
    # 输入文件或目录路径，支持多个文件
    'input_files': [
        # "assets/images/cats/ragdoll.png",  # 单个文件
        # "assets/images/cats/siamese.jpg",  # 单个文件
        "assets/images/cats",  # 目录（处理目录中所有图片）
    ],
    
    # 输出目录 (None=保存在原文件同目录)
    'output_directory': None,
}

# 日志配置
LOG_CONFIG = {
    'level': 'INFO',  # DEBUG, INFO, WARNING, ERROR
    'format': '%(asctime)s - %(levelname)s - %(message)s'
}

# 支持的图片格式
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}

# 设置日志
logging.basicConfig(level=getattr(logging, LOG_CONFIG['level']), format=LOG_CONFIG['format'])
logger = logging.getLogger(__name__)

class HighQualityResizer:
    """高质量图片缩放器"""
    
    # 缩放算法映射
    RESAMPLE_METHODS = {
        'lanczos': Image.LANCZOS,
        'bicubic': Image.BICUBIC,
        'bilinear': Image.BILINEAR,
        'nearest': Image.NEAREST,
    }
    
    def __init__(self):
        self.processed_count = 0
        self.failed_count = 0
    
    def resize_image_to_multiple_sizes(self, input_path, output_path, target_sizes, 
                                      method=None, sharpen=None, enhance_quality=None, quality=None):
        """
        将单张图片缩放到多个尺寸
        
        Args:
            input_path: 输入图片路径
            output_path: 输出图片路径（基础路径，会为每个尺寸生成不同文件名）
            target_sizes: 目标尺寸列表 [(width1, height1), (width2, height2), ...]
            method: 缩放算法 (None使用配置默认值)
            sharpen: 是否应用锐化 (None使用配置默认值)
            enhance_quality: 是否增强质量 (None使用配置默认值)
            quality: JPEG质量 (None使用配置默认值)
        
        Returns:
            成功处理的尺寸数量
        """
        if not isinstance(target_sizes, (list, tuple)):
            target_sizes = [target_sizes]
        
        success_count = 0
        logger.info(f"处理图片到 {len(target_sizes)} 个尺寸: {input_path}")
        
        for target_size in target_sizes:
            logger.info(f"处理尺寸: {target_size[0]}x{target_size[1]}")
            if self.resize_image(input_path, output_path, target_size, method, 
                               sharpen, enhance_quality, quality):
                success_count += 1
        
        return success_count

    def resize_image(self, input_path, output_path, target_size, 
                    method=None, sharpen=None, enhance_quality=None, quality=None, 
                    original_size=None):
        """
        高质量缩放单张图片
        
        Args:
            input_path: 输入图片路径
            output_path: 输出图片路径
            target_size: 目标尺寸 (width, height)
            method: 缩放算法 (None使用配置默认值)
            sharpen: 是否应用锐化 (None使用配置默认值)
            enhance_quality: 是否增强质量 (None使用配置默认值)
            quality: JPEG质量 (None使用配置默认值)
        """
        # 使用配置文件的默认值
        if method is None:
            method = RESIZE_CONFIG['resize_method']
        if sharpen is None:
            sharpen = RESIZE_CONFIG['enable_sharpen']
        if enhance_quality is None:
            enhance_quality = RESIZE_CONFIG['enable_enhance']
        if quality is None:
            quality = RESIZE_CONFIG['jpeg_quality']
        try:
            with Image.open(input_path) as img:
                logger.info(f"处理图片: {input_path}")
                logger.info(f"原始尺寸: {img.size}")
                
                # 如果target_size不是绝对像素值，需要解析
                if not (isinstance(target_size, (tuple, list)) and 
                       len(target_size) == 2 and 
                       all(isinstance(x, int) and x > 1 for x in target_size)):
                    # 解析尺寸配置
                    target_size = self._parse_size_config(target_size, img.size)
                    logger.info(f"解析后目标尺寸: {target_size}")
                
                # 转换图像模式，正确处理透明度
                if img.mode in ('RGBA', 'LA'):
                    # 已经是带透明度的模式，保持不变
                    pass
                elif img.mode == 'P':
                    # 调色板模式，检查是否有透明度
                    if 'transparency' in img.info:
                        # 有透明度，转换为RGBA保持透明背景
                        img = img.convert('RGBA')
                    else:
                        # 无透明度，转换为RGB
                        img = img.convert('RGB')
                elif img.mode != 'RGB':
                    # 其他模式转换为RGB
                    img = img.convert('RGB')
                
                # 计算缩放比例
                original_size = img.size
                scale_ratio = min(target_size[0]/original_size[0], target_size[1]/original_size[1])
                logger.info(f"缩放比例: {scale_ratio:.3f}")
                
                # 分步缩放以获得更好质量
                current_img = img
                if scale_ratio < RESIZE_CONFIG['progressive_scale_threshold']:
                    logger.info("使用分步缩放以提高质量")
                    current_ratio = 1.0
                    while current_ratio > scale_ratio * 2:
                        current_ratio *= 0.5
                        new_size = (int(original_size[0] * current_ratio), 
                                  int(original_size[1] * current_ratio))
                        current_img = current_img.resize(new_size, self.RESAMPLE_METHODS[method])
                
                # 最终缩放到目标尺寸
                resized_img = current_img.resize(target_size, self.RESAMPLE_METHODS[method])
                final_size = resized_img.size  # 记录最终尺寸用于文件名生成
                
                # 质量增强
                if enhance_quality:
                    # 锐化处理
                    if sharpen:
                        resized_img = resized_img.filter(ImageFilter.UnsharpMask(
                            radius=RESIZE_CONFIG['sharpen_radius'],
                            percent=RESIZE_CONFIG['sharpen_percent'],
                            threshold=RESIZE_CONFIG['sharpen_threshold']
                        ))
                    
                    # 增强对比度和色彩
                    enhancer = ImageEnhance.Contrast(resized_img)
                    resized_img = enhancer.enhance(RESIZE_CONFIG['contrast_factor'])
                    
                    enhancer = ImageEnhance.Color(resized_img)
                    resized_img = enhancer.enhance(RESIZE_CONFIG['color_factor'])
                
                # 生成包含尺寸信息的输出文件名
                final_output_path = self._generate_output_filename(input_path, output_path, final_size)
                
                # 保存图片
                save_kwargs = {}
                if final_output_path.lower().endswith(('.jpg', '.jpeg')):
                    save_kwargs = {
                        'quality': quality,
                        'optimize': True,
                        'progressive': True
                    }
                elif final_output_path.lower().endswith('.png'):
                    save_kwargs = {
                        'optimize': True,
                        'compress_level': 9
                    }
                
                resized_img.save(final_output_path, **save_kwargs)
                logger.info(f"已保存到: {final_output_path}")
                logger.info(f"最终尺寸: {final_size}")
                
                self.processed_count += 1
                return True
                
        except Exception as e:
            logger.error(f"处理失败 {input_path}: {str(e)}")
            self.failed_count += 1
            return False
    
    def _parse_size_config(self, size_config, original_size=None):
        """解析尺寸配置"""
        if size_config is None:
            return None

        if isinstance(size_config, str) and size_config.endswith('%'):
            if original_size is None:
                raise ValueError("百分比模式需要提供原始图片尺寸")
            percentage = float(size_config[:-1]) / 100.0
            return (int(original_size[0] * percentage), int(original_size[1] * percentage))

        elif isinstance(size_config, (int, float)) and not isinstance(size_config, bool):
            if original_size is None:
                raise ValueError("百分比模式需要提供原始图片尺寸")
            return (int(original_size[0] * size_config), int(original_size[1] * size_config))

        elif isinstance(size_config, (tuple, list)) and len(size_config) == 2:
            width, height = size_config
            if isinstance(width, (int, float)) and isinstance(height, (int, float)):
                if width <= 1.0 and height <= 1.0 and original_size is not None:
                    return (int(original_size[0] * width), int(original_size[1] * height))
                else:
                    return (int(width), int(height))

        raise ValueError(f"不支持的尺寸配置格式: {size_config}")
    
    def _generate_output_filename(self, input_path, output_path, final_size):
        """生成输出文件名"""
        if not RESIZE_CONFIG['add_suffix_to_filename']:
            return output_path

        output_path_obj = Path(output_path)
        size_tag = f"{final_size[0]}x{final_size[1]}"
        stem = output_path_obj.stem

        if size_tag not in stem:
            new_stem = f"{stem}_{size_tag}"
            new_output_path = output_path_obj.parent / \
                f"{new_stem}{output_path_obj.suffix}"
            return str(new_output_path)

        return output_path
    
    def batch_resize(self, input_dir, output_dir, target_size, 
                    method=None, **kwargs):
        """批量处理目录中的图片"""
        return self._batch_process_directory(input_dir, output_dir, target_size, method, **kwargs)
    
    def multi_file_resize(self, input_files, output_dir, target_size,
                         method=None, **kwargs):
        """处理多个指定的图片文件"""
        return self._batch_process_files(input_files, output_dir, target_size, method, **kwargs)
    
    def _batch_process_directory(self, input_dir, output_dir, target_size, 
                               method=None, **kwargs):
        """
        批量处理目录中的图片
        
        Args:
            input_dir: 输入目录
            output_dir: 输出目录
            target_size: 目标尺寸
            method: 缩放算法 (None使用配置默认值)
        """
        # 使用配置文件的默认值
        if method is None:
            method = RESIZE_CONFIG['resize_method']
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        
        if not input_path.exists():
            logger.error(f"输入目录不存在: {input_dir}")
            return
        
        # 创建输出目录
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 遍历所有图片文件
        image_files = []
        for ext in SUPPORTED_FORMATS:
            image_files.extend(input_path.rglob(f'*{ext}'))
            image_files.extend(input_path.rglob(f'*{ext.upper()}'))
        
        logger.info(f"找到 {len(image_files)} 张图片")
        
        for img_file in image_files:
            # 构建输出文件名（保持原始文件名，尺寸信息会在resize_image中自动添加）
            relative_path = img_file.relative_to(input_path)
            output_file = output_path / relative_path.parent / f"{relative_path.stem}{relative_path.suffix}"
            
            # 创建子目录
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            # 缩放图片（多尺寸模式）
            self.resize_image_to_multiple_sizes(str(img_file), str(output_file), target_size, method, **kwargs)
    
    def _batch_process_files(self, input_files, output_dir, target_size,
                           method=None, **kwargs):
        """
        处理多个指定的图片文件
        
        Args:
            input_files: 输入文件列表
            output_dir: 输出目录 (如果为None，则保存在各自的原始目录)
            target_size: 目标尺寸
            method: 缩放算法 (None使用配置默认值)
        """
        # 使用配置文件的默认值
        if method is None:
            method = RESIZE_CONFIG['resize_method']
            
        # 如果指定了输出目录，创建它
        if output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
        
        # 验证输入文件并过滤支持的格式
        valid_files = []
        for file_path in input_files:
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                logger.warning(f"文件不存在，跳过: {file_path}")
                continue
            
            if file_path_obj.suffix.lower() not in SUPPORTED_FORMATS:
                logger.warning(f"不支持的文件格式，跳过: {file_path}")
                continue
                
            valid_files.append(file_path_obj)
        
        if not valid_files:
            logger.error("没有找到有效的图片文件")
            return
        
        logger.info(f"找到 {len(valid_files)} 张有效图片")
        
        for img_file in valid_files:
            # 根据是否指定输出目录来确定输出路径
            if output_dir:
                # 有输出目录：保存到指定目录
                output_file = output_path / f"{img_file.stem}{img_file.suffix}"
            else:
                # 没有输出目录：保存在原文件的同一目录
                output_file = img_file.parent / f"{img_file.stem}{img_file.suffix}"
            
            logger.info(f"处理文件: {img_file}")
            
            # 缩放图片（多尺寸模式）
            self.resize_image_to_multiple_sizes(str(img_file), str(output_file), target_size, method, **kwargs)
    
    def print_summary(self):
        """打印处理总结"""
        logger.info(f"处理完成!")
        logger.info(f"成功处理: {self.processed_count} 张")
        logger.info(f"失败: {self.failed_count} 张")


def main():
    """主函数"""
    print("🖼️ 高质量图片缩放工具")
    print("="*50)
    
    resizer = HighQualityResizer()
    
    # 获取输入文件
    input_files = []
    for input_path in INPUT_CONFIG['input_files']:
        if isinstance(input_path, str):
            path_obj = Path(input_path)
            if path_obj.is_file():
                # 单个文件
                if path_obj.suffix.lower() in SUPPORTED_FORMATS:
                    input_files.append(input_path)
            elif path_obj.is_dir():
                # 目录
                for ext in SUPPORTED_FORMATS:
                    input_files.extend([str(f) for f in path_obj.rglob(f'*{ext}')])
                    input_files.extend([str(f) for f in path_obj.rglob(f'*{ext.upper()}')])
    
    input_files = sorted(list(set(input_files)))
    
    if not input_files:
        logger.error("没有找到有效的图片文件")
        print("💡 请检查 INPUT_CONFIG['input_files'] 中的路径是否正确")
        sys.exit(1)
    
    logger.info(f"找到 {len(input_files)} 个图片文件")
    
    # 使用配置文件中的多尺寸设置
    target_size = RESIZE_CONFIG['target_sizes']
    
    # 显示配置信息
    print(f"📁 输入文件: {len(input_files)} 个")
    print(f"📂 输出目录: {INPUT_CONFIG['output_directory'] or '与输入文件同目录'}")
    print(f"🖼️ 目标尺寸: {[f'{s[0]}x{s[1]}' for s in target_size]}")
    print(f"🔧 缩放算法: {RESIZE_CONFIG['resize_method']}")
    print(f"✨ 图像增强: {'开启' if RESIZE_CONFIG['enable_enhance'] else '关闭'}")
    print(f"🔪 锐化处理: {'开启' if RESIZE_CONFIG['enable_sharpen'] else '关闭'}")
    print("="*50)
    
    # 处理文件
    for input_file in input_files:
        input_path = Path(input_file)
        
        # 确定输出路径
        if INPUT_CONFIG['output_directory']:
            output_path = Path(INPUT_CONFIG['output_directory'])
            output_path.mkdir(parents=True, exist_ok=True)
            output_file = output_path / f"{input_path.stem}{input_path.suffix}"
        else:
            output_file = input_path.parent / f"{input_path.stem}{input_path.suffix}"
        
        logger.info(f"处理文件: {input_path.name}")
        
        # 多尺寸处理
        resizer.resize_image_to_multiple_sizes(
            str(input_path), 
            str(output_file), 
            target_size, 
            method=RESIZE_CONFIG['resize_method'],
            sharpen=RESIZE_CONFIG['enable_sharpen'],
            enhance_quality=RESIZE_CONFIG['enable_enhance'],
            quality=RESIZE_CONFIG['jpeg_quality']
        )
    
    resizer.print_summary()


if __name__ == '__main__':
    main()
