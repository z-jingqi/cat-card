#!/usr/bin/env python3
"""
背景移除工具
支持单张图片或批量处理，使用AI模型移除图片背景
"""

import os
import sys
from pathlib import Path
import logging

try:
    from rembg import remove, new_session
    from PIL import Image
    import io
except ImportError as e:
    print(f"❌ 错误: 缺少必要的依赖包 - {e}")
    print("💡 这通常表示虚拟环境未正确激活")
    # 不要直接退出，让调用者处理
    raise

# =============================================================================
# 配置区域 - 修改这里的参数来自定义背景移除行为
# =============================================================================

# 背景移除配置
BG_REMOVER_CONFIG = {
    # AI模型选择
    'model_name': 'u2net',            # 推荐: u2net (通用), u2net_human_seg (人像)

    # 输出格式
    'keep_alpha': True,               # True=透明背景(.png), False=白色背景(.jpg)

    # 文件命名
    'background_suffix': '_nobg',     # 背景移除后缀

    # 图片质量
    'jpeg_quality': 95,               # JPEG质量 (1-100, 越高越好)
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

# 可用的AI模型说明:
# 'u2net'           - 通用模型，适合各种场景 (推荐)
# 'u2net_human_seg' - 人像专用，人物照片效果更好
# 'isnet-general-use' - 最高质量，但速度较慢
# 'silueta'         - 速度最快，质量中等

# 设置日志
logging.basicConfig(level=getattr(logging, LOG_CONFIG['level']), format=LOG_CONFIG['format'])
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
                img.save(output_path, quality=BG_REMOVER_CONFIG['jpeg_quality'])
            
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
        
        # 遍历所有图片文件
        image_files = []
        for ext in SUPPORTED_FORMATS:
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
    """主函数"""
    print("🤖 AI背景移除工具")
    print("="*50)
    
    # 创建背景移除器
    try:
        remover = BackgroundRemover(model_name=BG_REMOVER_CONFIG['model_name'])
    except Exception as e:
        logger.error(f"❌ 初始化失败: {str(e)}")
        sys.exit(1)
    
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
    
    # 显示配置信息
    print(f"📁 输入文件: {len(input_files)} 个")
    print(f"📂 输出目录: {INPUT_CONFIG['output_directory'] or '与输入文件同目录'}")
    print(f"🤖 AI模型: {BG_REMOVER_CONFIG['model_name']}")
    print(f"🎨 透明背景: {'是' if BG_REMOVER_CONFIG['keep_alpha'] else '否'}")
    print("="*50)
    
    # 处理文件
    for input_file in input_files:
        input_path = Path(input_file)
        
        # 确定输出路径
        if INPUT_CONFIG['output_directory']:
            output_path = Path(INPUT_CONFIG['output_directory'])
            output_path.mkdir(parents=True, exist_ok=True)
            output_file = output_path / f"{input_path.stem}_nobg{input_path.suffix}"
        else:
            output_file = input_path.parent / f"{input_path.stem}_nobg{input_path.suffix}"
        
        logger.info(f"处理文件: {input_path.name}")
        
        # 移除背景
        remover.remove_background(
            str(input_path), 
            str(output_file), 
            keep_alpha=BG_REMOVER_CONFIG['keep_alpha']
        )
    
    remover.print_summary()


if __name__ == '__main__':
    main()
