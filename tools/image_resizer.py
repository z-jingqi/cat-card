#!/usr/bin/env python3
"""
高质量图片缩放工具
支持单张图片或批量处理，提供多种缩放算法以获得最佳质量
"""

import os
import sys
from PIL import Image, ImageFilter, ImageEnhance
import argparse
from pathlib import Path
import logging

# 导入配置文件
try:
    from . import config
except ImportError:
    import config

# 设置日志
logging.basicConfig(level=getattr(logging, config.LOG_LEVEL), format=config.LOG_FORMAT)
logger = logging.getLogger(__name__)

class HighQualityResizer:
    """高质量图片缩放器"""
    
    # 从配置文件导入缩放算法映射
    RESAMPLE_METHODS = config.RESAMPLE_METHODS
    
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
            method = config.DEFAULT_RESIZE_METHOD
        if sharpen is None:
            sharpen = config.DEFAULT_SHARPEN_ENABLED
        if enhance_quality is None:
            enhance_quality = config.DEFAULT_ENHANCE_ENABLED
        if quality is None:
            quality = config.DEFAULT_JPEG_QUALITY
        try:
            with Image.open(input_path) as img:
                logger.info(f"处理图片: {input_path}")
                logger.info(f"原始尺寸: {img.size}")
                
                # 如果target_size不是绝对像素值，需要解析
                if not (isinstance(target_size, (tuple, list)) and 
                       len(target_size) == 2 and 
                       all(isinstance(x, int) and x > 1 for x in target_size)):
                    # 使用配置文件的解析函数
                    target_size = config.parse_size_config(target_size, img.size)
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
                if scale_ratio < config.PROGRESSIVE_SCALE_THRESHOLD:
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
                            radius=config.SHARPEN_RADIUS,
                            percent=config.SHARPEN_PERCENT,
                            threshold=config.SHARPEN_THRESHOLD
                        ))
                    
                    # 增强对比度和色彩
                    enhancer = ImageEnhance.Contrast(resized_img)
                    resized_img = enhancer.enhance(config.CONTRAST_ENHANCE_FACTOR)
                    
                    enhancer = ImageEnhance.Color(resized_img)
                    resized_img = enhancer.enhance(config.COLOR_ENHANCE_FACTOR)
                
                # 生成包含尺寸信息的输出文件名
                final_output_path = config.generate_output_filename(input_path, output_path, final_size)
                
                # 保存图片
                save_kwargs = {}
                if final_output_path.lower().endswith(('.jpg', '.jpeg')):
                    save_kwargs = {
                        'quality': quality,
                        **config.JPEG_SAVE_PARAMS
                    }
                elif final_output_path.lower().endswith('.png'):
                    save_kwargs = config.PNG_SAVE_PARAMS.copy()
                
                resized_img.save(final_output_path, **save_kwargs)
                logger.info(f"已保存到: {final_output_path}")
                logger.info(f"最终尺寸: {final_size}")
                
                self.processed_count += 1
                return True
                
        except Exception as e:
            logger.error(f"处理失败 {input_path}: {str(e)}")
            self.failed_count += 1
            return False
    
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
            method = config.DEFAULT_RESIZE_METHOD
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        
        if not input_path.exists():
            logger.error(f"输入目录不存在: {input_dir}")
            return
        
        # 创建输出目录
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 支持的图片格式
        supported_formats = config.SUPPORTED_IMAGE_FORMATS
        
        # 遍历所有图片文件
        image_files = []
        for ext in supported_formats:
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
            method = config.DEFAULT_RESIZE_METHOD
            
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
            
            if file_path_obj.suffix.lower() not in config.SUPPORTED_IMAGE_FORMATS:
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
    parser = argparse.ArgumentParser(
        description='高质量图片缩放工具（支持多尺寸输出）',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
使用示例:
  # 使用配置文件中的多尺寸设置处理图片
  python image_resizer.py -i ../assets/bell.jpg --multi-size
  # 输出: ../assets/bell_256x256.jpg, ../assets/bell_128x128.jpg
  
  # 处理单张图片指定单个尺寸
  python image_resizer.py -i ../assets/bell.jpg -s 200 200
  # 输出: ../assets/bell_200x200.jpg
  
  # 处理多张图片使用多尺寸设置
  python image_resizer.py -i ../assets/cat.jpg ../assets/dog.jpg --multi-size
  # 每个图片都会输出多个尺寸版本
  
  # 批量处理整个目录 (使用多尺寸设置)
  python image_resizer.py -i ../assets/images -o ../assets/resized --batch --multi-size
  
  # 百分比缩放
  python image_resizer.py -i file1.jpg -s 50%

配置文件: tools/config.py 中的 RESIZE_SETTINGS['target_sizes']
        """
    )
    
    parser.add_argument('-i', '--input', nargs='+',
                       required=config.DEFAULT_INPUT_PATH is None,
                       default=config.DEFAULT_INPUT_PATH,
                       help=f'输入文件或目录路径，支持多个文件 (默认: {config.DEFAULT_INPUT_PATH or "必须指定"})')
    parser.add_argument('-o', '--output',
                       required=False, 
                       default=config.DEFAULT_OUTPUT_PATH,
                       help=f'输出文件或目录路径 (默认: 与输入文件同目录)')
    parser.add_argument('-s', '--size', nargs='+', 
                       required=False,
                       default=None,
                       metavar=('SIZE'), 
                       help='目标尺寸，支持多种格式:\\n'
                            '  - 两个数字: 宽度 高度，如 400 300\\n'
                            '  - 百分比: 50%% (等比例缩放)\\n'
                            '  - 小数: 0.5 (等比例缩放)\\n'
                            '  - 两个小数: 0.8 0.6 (分别缩放宽高)\\n'
                            f'  (默认: {config.format_size_description(config.get_target_sizes()).replace("%", "%%")})')
    parser.add_argument('--multi-size', action='store_true', 
                       help='使用配置文件中的多尺寸设置（忽略-s参数）')
    parser.add_argument('-m', '--method', default=config.DEFAULT_RESIZE_METHOD,
                       choices=list(config.RESAMPLE_METHODS.keys()),
                       help=f'缩放算法 (默认: {config.DEFAULT_RESIZE_METHOD})')
    parser.add_argument('--batch', action='store_true', default=config.DEFAULT_BATCH_MODE,
                       help=f'批量处理模式 (默认: {config.DEFAULT_BATCH_MODE})')
    parser.add_argument('--no-sharpen', action='store_true',
                       help=f'不应用锐化 (默认锐化: {config.DEFAULT_SHARPEN_ENABLED})')
    parser.add_argument('--no-enhance', action='store_true',
                       help=f'不增强质量 (默认增强: {config.DEFAULT_ENHANCE_ENABLED})')
    parser.add_argument('-q', '--quality', type=int, default=config.DEFAULT_JPEG_QUALITY,
                       help=f'JPEG质量 (1-100) (默认: {config.DEFAULT_JPEG_QUALITY})')
    parser.add_argument('--no-size-tag', action='store_true',
                       help=f'不在文件名中添加尺寸标签 (默认添加: {config.AUTO_ADD_SIZE_TO_FILENAME})')
    parser.add_argument('--preset', choices=list(config.PRESETS.keys()),
                       help='使用预设配置 (会覆盖其他相关参数)')
    
    args = parser.parse_args()
    
    # 解析尺寸参数
    if hasattr(args, 'size') and args.size is not None and not isinstance(args.size, (tuple, int, float, str)):
        # 只有当从命令行输入的list格式才需要解析，配置文件中的格式保持不变
        if isinstance(args.size, list):
            if len(args.size) == 1:
                # 单个参数
                size_arg = str(args.size[0])
                if size_arg.endswith('%'):
                    # 百分比字符串
                    args.size = size_arg
                else:
                    try:
                        # 尝试转换为数字
                        num_val = float(size_arg)
                        args.size = num_val
                    except ValueError:
                        parser.error(f"无效的尺寸格式: {size_arg}")
            elif len(args.size) == 2:
                # 两个参数
                try:
                    width = float(args.size[0])
                    height = float(args.size[1])
                    args.size = (width, height)
                except ValueError:
                    parser.error(f"无效的尺寸格式: {args.size}")
            else:
                parser.error(f"尺寸参数个数错误，期望1-2个参数，得到{len(args.size)}个")
    
    # 应用预设配置
    if args.preset:
        preset = config.PRESETS[args.preset]
        logger.info(f"使用预设配置: {args.preset}")
        
        # 覆盖相关参数
        if 'target_size' in preset:
            args.size = preset['target_size']
        if 'method' in preset:
            args.method = preset['method']
        if 'quality' in preset:
            args.quality = preset['quality']
    
    resizer = HighQualityResizer()
    
    # 处理尺寸配置
    if args.multi_size or args.size is None:
        # 使用配置文件中的多尺寸设置
        target_size = config.get_target_sizes()
        logger.info(f"使用配置文件中的多尺寸设置: {[f'{s[0]}x{s[1]}' for s in target_size]}")
    else:
        # 使用命令行参数指定的尺寸，转换为多尺寸格式
        if isinstance(args.size, (tuple, list)) and len(args.size) == 2:
            target_size = [tuple(args.size)]  # 单个尺寸转换为列表格式
        else:
            target_size = [args.size]  # 其他格式也转换为列表
        logger.info(f"使用命令行指定的尺寸: {target_size}")
    
    # 处理尺寸标签设置
    original_setting = None
    if args.no_size_tag:
        # 临时禁用自动添加尺寸功能
        original_setting = config.AUTO_ADD_SIZE_TO_FILENAME
        config.AUTO_ADD_SIZE_TO_FILENAME = False
    
    # 确定处理模式
    input_list = args.input if isinstance(args.input, list) else [args.input]
    
    # 单文件和多文件模式默认使用输入文件的同一目录
    
    if args.batch:
        # 批量处理模式：处理目录
        if len(input_list) != 1:
            logger.error("批量处理模式只能指定一个输入目录")
            sys.exit(1)
        
        input_path = Path(input_list[0])
        if not input_path.is_dir():
            logger.error(f"批量处理模式需要输入目录，但得到的是文件: {input_path}")
            sys.exit(1)
        
        if not args.output:
            logger.error("批量处理模式必须指定输出目录 (-o)")
            sys.exit(1)
        
        resizer.batch_resize(
            str(input_path), 
            args.output, 
            target_size, 
            method=args.method,
            sharpen=not args.no_sharpen,
            enhance_quality=not args.no_enhance,
            quality=args.quality
        )
    elif len(input_list) == 1:
        # 单文件处理模式
        input_path = Path(input_list[0])
        
        if input_path.is_dir():
            logger.error(f"单文件模式不能处理目录，请使用 --batch 参数: {input_path}")
            sys.exit(1)
        
        # 如果没有指定输出路径，使用输入文件的同一目录
        if not args.output:
            output_path = input_path.parent / f"{input_path.stem}{input_path.suffix}"
        else:
            output_path = args.output
        
        # 多尺寸处理
        resizer.resize_image_to_multiple_sizes(
            str(input_path), 
            str(output_path), 
            target_size, 
            method=args.method,
            sharpen=not args.no_sharpen,
            enhance_quality=not args.no_enhance,
            quality=args.quality
        )
    else:
        # 多文件处理模式
        if args.output:
            # 如果指定了输出路径，检查它必须是目录而不是文件
            output_path = Path(args.output)
            if output_path.suffix:  # 如果输出路径有扩展名，说明是文件而不是目录
                logger.error("处理多个文件时，输出路径必须是目录而不是文件")
                sys.exit(1)
        
        logger.info(f"多文件处理模式：处理 {len(input_list)} 个文件")
        if args.output:
            logger.info(f"输出到: {args.output}")
        else:
            logger.info("输出到: 各文件的原始目录")
        
        resizer.multi_file_resize(
            input_list,
            args.output,  # 可能是None，表示保存在原始目录
            target_size, 
            method=args.method,
            sharpen=not args.no_sharpen,
            enhance_quality=not args.no_enhance,
            quality=args.quality
        )
    
    resizer.print_summary()
    
    # 恢复原始设置
    if args.no_size_tag and original_setting is not None:
        config.AUTO_ADD_SIZE_TO_FILENAME = original_setting


if __name__ == '__main__':
    main()
