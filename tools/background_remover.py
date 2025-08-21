#!/usr/bin/env python3
"""
背景移除工具
支持单张图片或批量处理，使用AI模型移除图片背景
"""

import os
import sys
from pathlib import Path
import logging
import argparse

try:
    from rembg import remove, new_session
    from PIL import Image
    import io
except ImportError as e:
    print(f"❌ 错误: 缺少必要的依赖包 - {e}")
    print("💡 这通常表示虚拟环境未正确激活")
    # 不要直接退出，让调用者处理
    raise

# 导入配置文件
try:
    from . import config
except ImportError:
    import config

# 设置日志
logging.basicConfig(level=getattr(logging, config.LOG_LEVEL), format=config.LOG_FORMAT)
logger = logging.getLogger(__name__)

class BackgroundRemover:
    """背景移除器"""
    
    # 支持的模型
    SUPPORTED_MODELS = {
        'u2net': 'U-2-Net 通用模型 (推荐)',
        'u2net_human_seg': 'U-2-Net 人像分割专用',
        'u2net_cloth_seg': 'U-2-Net 服装分割专用',
        'isnet-general-use': 'IS-Net 高质量通用模型',
        'silueta': 'Silueta 轮廓检测模型',
        'dis-general-use': 'DIS 通用分割模型'
    }
    
    def __init__(self, model_name='u2net'):
        """
        初始化背景移除器
        
        Args:
            model_name: 使用的模型名称
        """
        self.model_name = model_name
        self.session = None
        self.processed_count = 0
        self.failed_count = 0
        
        # 初始化模型会话
        self._init_session()
    
    def _init_session(self):
        """初始化模型会话"""
        try:
            logger.info(f"正在加载模型: {self.model_name}")
            self.session = new_session(self.model_name)
            logger.info("✅ 模型加载成功")
        except Exception as e:
            logger.error(f"❌ 模型加载失败: {str(e)}")
            logger.info("💡 提示: 如果是第一次使用，模型需要下载，请耐心等待")
            raise
    
    def remove_background(self, input_path, output_path, keep_alpha=True):
        """
        移除单张图片的背景
        
        Args:
            input_path: 输入图片路径
            output_path: 输出图片路径
            keep_alpha: 是否保持透明通道
        
        Returns:
            bool: 处理是否成功
        """
        try:
            logger.info(f"处理图片: {input_path}")
            
            # 读取输入图片
            with open(input_path, 'rb') as input_file:
                input_data = input_file.read()
            
            # 移除背景
            logger.info("正在移除背景...")
            output_data = remove(input_data, session=self.session)
            
            # 如果需要处理透明度
            if keep_alpha:
                # 直接保存为PNG格式（保持透明度）
                output_path = self._ensure_png_extension(output_path)
                with open(output_path, 'wb') as output_file:
                    output_file.write(output_data)
            else:
                # 转换为白色背景
                img = Image.open(io.BytesIO(output_data))
                if img.mode in ('RGBA', 'LA'):
                    # 创建白色背景
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])  # 使用alpha通道作为mask
                    img = background
                
                # 保存为指定格式
                img.save(output_path, quality=config.DEFAULT_JPEG_QUALITY)
            
            logger.info(f"✅ 已保存到: {output_path}")
            self.processed_count += 1
            return True
            
        except Exception as e:
            logger.error(f"❌ 处理失败 {input_path}: {str(e)}")
            self.failed_count += 1
            return False
    
    def _ensure_png_extension(self, output_path):
        """确保输出路径使用PNG扩展名（用于保持透明度）"""
        path_obj = Path(output_path)
        if path_obj.suffix.lower() != '.png':
            return str(path_obj.with_suffix('.png'))
        return output_path
    
    def batch_remove_background(self, input_dir, output_dir, **kwargs):
        """
        批量移除目录中图片的背景
        
        Args:
            input_dir: 输入目录
            output_dir: 输出目录
            **kwargs: 其他参数传递给remove_background
        """
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
            # 构建输出文件名
            relative_path = img_file.relative_to(input_path)
            output_file = output_path / relative_path.parent / f"{relative_path.stem}_nobg{relative_path.suffix}"
            
            # 创建子目录
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            # 移除背景
            self.remove_background(str(img_file), str(output_file), **kwargs)
    
    def multi_file_remove_background(self, input_files, output_dir=None, **kwargs):
        """
        处理多个指定的图片文件
        
        Args:
            input_files: 输入文件列表
            output_dir: 输出目录 (如果为None，则保存在各自的原始目录)
            **kwargs: 其他参数传递给remove_background
        """
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
                output_file = output_path / f"{img_file.stem}_nobg{img_file.suffix}"
            else:
                # 没有输出目录：保存在原文件的同一目录
                output_file = img_file.parent / f"{img_file.stem}_nobg{img_file.suffix}"
            
            logger.info(f"处理文件: {img_file}")
            
            # 移除背景
            self.remove_background(str(img_file), str(output_file), **kwargs)
    
    def print_summary(self):
        """打印处理总结"""
        logger.info("=" * 50)
        logger.info("🎉 背景移除完成!")
        logger.info(f"✅ 成功处理: {self.processed_count} 张")
        logger.info(f"❌ 失败: {self.failed_count} 张")
        logger.info(f"🤖 使用模型: {self.model_name}")
        if self.model_name in self.SUPPORTED_MODELS:
            logger.info(f"📝 模型说明: {self.SUPPORTED_MODELS[self.model_name]}")
        logger.info("=" * 50)


def main():
    parser = argparse.ArgumentParser(
        description='AI背景移除工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
使用示例:
  # 处理单张图片 (保存为PNG格式，保持透明背景)
  python background_remover.py -i ../assets/cat.jpg
  # 输出: ../assets/cat_nobg.png
  
  # 处理多张图片 (保存在各自的原始目录)
  python background_remover.py -i ../assets/cat1.jpg ../assets/cat2.jpg
  # 输出: ../assets/cat1_nobg.png, ../assets/cat2_nobg.png
  
  # 处理多张图片到指定目录
  python background_remover.py -i file1.jpg file2.jpg -o output_dir
  # 输出: output_dir/file1_nobg.png, output_dir/file2_nobg.png
  
  # 批量处理整个目录 (必须指定输出目录)
  python background_remover.py -i ../assets/images -o ../assets/nobg --batch
  
  # 使用不同的AI模型
  python background_remover.py -i input.jpg -m u2net_human_seg
  
  # 输出白色背景而不是透明背景
  python background_remover.py -i input.jpg --white-bg

可用模型: {', '.join(BackgroundRemover.SUPPORTED_MODELS.keys())}

💡 提示:
- 第一次使用会自动下载模型文件 (~200MB)
- u2net: 通用场景，推荐使用
- u2net_human_seg: 人像效果更好
- isnet-general-use: 质量最高，但速度较慢
        """
    )
    
    parser.add_argument('-i', '--input', nargs='+', required=True,
                       help='输入文件或目录路径，支持多个文件')
    parser.add_argument('-o', '--output',
                       help='输出文件或目录路径 (默认: 与输入文件同目录)')
    parser.add_argument('-m', '--model', default='u2net',
                       choices=list(BackgroundRemover.SUPPORTED_MODELS.keys()),
                       help='AI模型选择 (默认: u2net)')
    parser.add_argument('--batch', action='store_true',
                       help='批量处理模式')
    parser.add_argument('--white-bg', action='store_true',
                       help='输出白色背景而不是透明背景')
    parser.add_argument('--list-models', action='store_true',
                       help='列出所有可用的AI模型')
    
    args = parser.parse_args()
    
    # 列出模型信息
    if args.list_models:
        print("🤖 可用的AI模型:")
        print("=" * 60)
        for model_name, description in BackgroundRemover.SUPPORTED_MODELS.items():
            print(f"  • {model_name:20} - {description}")
        print("=" * 60)
        print("\n💡 使用 -m 参数选择模型，例如: -m u2net_human_seg")
        return
    
    # 创建背景移除器
    try:
        remover = BackgroundRemover(model_name=args.model)
    except Exception as e:
        logger.error(f"❌ 初始化失败: {str(e)}")
        sys.exit(1)
    
    # 确定处理模式
    input_list = args.input if isinstance(args.input, list) else [args.input]
    
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
        
        remover.batch_remove_background(
            str(input_path), 
            args.output, 
            keep_alpha=not args.white_bg
        )
    elif len(input_list) == 1:
        # 单文件处理模式
        input_path = Path(input_list[0])
        
        if input_path.is_dir():
            logger.error(f"单文件模式不能处理目录，请使用 --batch 参数: {input_path}")
            sys.exit(1)
        
        # 如果没有指定输出路径，使用输入文件的同一目录
        if not args.output:
            output_path = input_path.parent / f"{input_path.stem}_nobg{input_path.suffix}"
        else:
            output_path = args.output
        
        remover.remove_background(
            str(input_path), 
            str(output_path), 
            keep_alpha=not args.white_bg
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
        
        remover.multi_file_remove_background(
            input_list,
            args.output,  # 可能是None，表示保存在原始目录
            keep_alpha=not args.white_bg
        )
    
    remover.print_summary()


if __name__ == '__main__':
    main()
