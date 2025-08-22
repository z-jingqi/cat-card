#!/usr/bin/env python3
"""
图片裁剪工具 - 支持手动指定裁剪范围和比例
独立运行，使用自己的配置文件
"""

import os
import sys
import logging
from pathlib import Path
from typing import List, Tuple, Union, Optional
from PIL import Image

# =============================================================================
# 配置区域 - 修改这里的参数来自定义裁剪行为
# =============================================================================

# 裁剪配置
CROP_CONFIG = {
    # 裁剪模式 - 'box' 或 'percentage'
    'crop_mode': 'percentage',
    
    # 裁剪区域配置 (当crop_mode='box'时使用)
    'crop_box': (100, 100, 900, 900),  # (left, top, right, bottom)
    
    # 百分比裁剪配置 (当crop_mode='percentage'时使用)
    'horizontal_percent': 0.1,  # 水平裁剪20% (0.0-1.0)
    'vertical_percent': 0.1,    # 垂直裁剪20% (0.0-1.0)
    
    # 图片质量
    'quality': 95,              # JPEG质量 (1-100, 越高越好)
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

class ImageCropper:
    """图片裁剪工具"""
    
    def __init__(self, log_level: str = 'INFO'):
        """初始化裁剪器"""
        self.setup_logging(log_level)
        self.logger = logging.getLogger(__name__)
        
    def setup_logging(self, level: str) -> None:
        """设置日志"""
        logging.basicConfig(
            level=getattr(logging, level.upper()),
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
    
    def crop_by_box(
        self,
        input_path: str,
        output_path: str,
        crop_box: Tuple[int, int, int, int],
        quality: int = 95
    ) -> bool:
        """
        按指定区域裁剪图片
        
        Args:
            input_path: 输入图片路径
            output_path: 输出图片路径
            crop_box: 裁剪区域 (left, top, right, bottom)
            quality: JPEG质量 (1-100)
            
        Returns:
            bool: 裁剪是否成功
        """
        try:
            self.logger.info(f"正在裁剪: {Path(input_path).name}")
            self.logger.info(f"裁剪区域: {crop_box}")
            
            # 打开图片
            with Image.open(input_path) as img:
                # 验证裁剪区域
                img_width, img_height = img.size
                left, top, right, bottom = crop_box
                
                if left < 0 or top < 0 or right > img_width or bottom > img_height:
                    self.logger.error(f"裁剪区域 {crop_box} 超出图片边界 {img.size}")
                    return False
                
                if left >= right or top >= bottom:
                    self.logger.error(f"无效的裁剪区域: {crop_box}")
                    return False
                
                # 裁剪图片
                cropped = img.crop(crop_box)
                
                # 生成新的输出文件名（添加_cropped后缀）
                output_path = self._generate_output_filename(output_path)
                
                # 确保输出目录存在
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                
                # 保存图片
                save_params = self._get_save_params(output_path, quality)
                cropped.save(output_path, **save_params)
                
                self.logger.info(f"裁剪完成: {Path(output_path).name} ({cropped.size[0]}x{cropped.size[1]})")
                return True
                
        except Exception as e:
            self.logger.error(f"裁剪失败 {Path(input_path).name}: {str(e)}")
            return False
    
    def crop_by_percentage(
        self,
        input_path: str,
        output_path: str,
        horizontal_percent: float,
        vertical_percent: float,
        quality: int = 95
    ) -> bool:
        """
        按百分比裁剪图片
        
        Args:
            input_path: 输入图片路径
            output_path: 输出图片路径
            horizontal_percent: 水平裁剪百分比 (0.0-1.0)
            vertical_percent: 垂直裁剪百分比 (0.0-1.0)
            quality: JPEG质量 (1-100)
            
        Returns:
            bool: 裁剪是否成功
        """
        try:
            self.logger.info(f"正在按百分比裁剪: {Path(input_path).name}")
            self.logger.info(f"水平裁剪: {horizontal_percent*100:.1f}%, 垂直裁剪: {vertical_percent*100:.1f}%")
            
            with Image.open(input_path) as img:
                img_width, img_height = img.size
                
                # 计算裁剪区域
                left = int(img_width * horizontal_percent)
                top = int(img_height * vertical_percent)
                right = img_width - left
                bottom = img_height - top
                
                crop_box = (left, top, right, bottom)
                self.logger.info(f"计算出的裁剪区域: {crop_box}")
                
                return self.crop_by_box(input_path, output_path, crop_box, quality)
                
        except Exception as e:
            self.logger.error(f"按百分比裁剪失败 {Path(input_path).name}: {str(e)}")
            return False
    
    def crop_multiple_files(
        self,
        input_files: List[str],
        output_directory: Optional[str],
        crop_config: dict,
        delete_original: bool = False
    ) -> Tuple[int, int]:
        """
        批量裁剪多个文件
        
        Args:
            input_files: 输入文件列表
            output_directory: 输出目录 (None=保存在原文件目录)
            crop_config: 裁剪配置
            delete_original: 是否删除原文件
            
        Returns:
            Tuple[int, int]: (成功数量, 失败数量)
        """
        success_count = 0
        failed_count = 0
        
        self.logger.info(f"开始批量裁剪 {len(input_files)} 个文件")
        
        for input_file in input_files:
            input_path = Path(input_file)
            if not input_path.exists():
                self.logger.warning(f"文件不存在，跳过: {input_file}")
                failed_count += 1
                continue
            
            # 确定输出路径
            if output_directory:
                output_path = Path(output_directory) / input_path.name
            else:
                output_path = input_path.parent / input_path.name
            
            # 生成新的输出文件名（添加_cropped后缀）
            output_path = self._generate_output_filename(str(output_path))
            
            # 执行裁剪
            success = False
            
            if 'crop_box' in crop_config:
                # 手动指定裁剪区域
                success = self.crop_by_box(
                    str(input_path),
                    str(output_path),
                    crop_config['crop_box'],
                    crop_config.get('quality', 95)
                )
            elif 'horizontal_percent' in crop_config and 'vertical_percent' in crop_config:
                # 按百分比裁剪
                success = self.crop_by_percentage(
                    str(input_path),
                    str(output_path),
                    crop_config['horizontal_percent'],
                    crop_config['vertical_percent'],
                    crop_config.get('quality', 95)
                )
            else:
                self.logger.error(f"无效的裁剪配置: {crop_config}")
                failed_count += 1
                continue
            
            if success:
                success_count += 1
                
                # 删除原文件（如果配置了）
                if delete_original:
                    try:
                        input_path.unlink()
                        self.logger.info(f"已删除原文件: {input_path.name}")
                    except Exception as e:
                        self.logger.warning(f"删除原文件失败: {e}")
            else:
                failed_count += 1
        
        self.logger.info(f"批量裁剪完成: 成功 {success_count}, 失败 {failed_count}")
        return success_count, failed_count
    
    def _generate_output_filename(self, original_path: str) -> str:
        """生成新的输出文件名（添加_cropped后缀）"""
        path_obj = Path(original_path)
        stem = path_obj.stem
        
        # 如果已经有_cropped后缀，不再添加
        if stem.endswith('_cropped'):
            return original_path
        
        new_name = f"{stem}_cropped{path_obj.suffix}"
        return str(path_obj.parent / new_name)
    
    def _get_save_params(self, output_path: str, quality: int) -> dict:
        """获取保存参数"""
        ext = Path(output_path).suffix.lower()
        
        if ext in {'.jpg', '.jpeg'}:
            return {
                'quality': quality,
                'optimize': True,
                'progressive': True
            }
        elif ext == '.png':
            return {
                'optimize': True,
                'compress_level': 9
            }
        else:
            return {}


def collect_image_files(
    input_path: Union[str, List[str]],
    supported_formats: Optional[set] = None
) -> List[str]:
    """
    收集图片文件
    
    Args:
        input_path: 输入路径（文件/目录/文件列表）
        supported_formats: 支持的格式
        
    Returns:
        List[str]: 图片文件路径列表
    """
    if supported_formats is None:
        supported_formats = SUPPORTED_FORMATS
    
    image_files = []
    
    if isinstance(input_path, str):
        path_obj = Path(input_path)
        if path_obj.is_file():
            # 单个文件
            if path_obj.suffix.lower() in supported_formats:
                image_files.append(str(path_obj))
        elif path_obj.is_dir():
            # 目录
            for ext in supported_formats:
                image_files.extend(
                    [str(f) for f in path_obj.rglob(f'*{ext}')]
                )
                image_files.extend(
                    [str(f) for f in path_obj.rglob(f'*{ext.upper()}')]
                )
    elif isinstance(input_path, list):
        # 文件列表
        for file_path in input_path:
            path_obj = Path(file_path)
            if path_obj.exists() and path_obj.suffix.lower() in supported_formats:
                image_files.append(str(path_obj))
    
    return sorted(list(set(image_files)))


def main():
    """主函数"""
    # 设置日志
    logging.basicConfig(
        level=getattr(logging, LOG_CONFIG['level']),
        format=LOG_CONFIG['format']
    )
    logger = logging.getLogger(__name__)
    
    print("✂️ 图片裁剪工具")
    print("="*50)
    
    # 创建裁剪器
    cropper = ImageCropper(log_level=LOG_CONFIG['level'])
    
    # 获取输入文件
    input_files = collect_image_files(INPUT_CONFIG['input_files'], SUPPORTED_FORMATS)
    if not input_files:
        logger.error("没有找到有效的图片文件")
        print("💡 请检查 INPUT_CONFIG['input_files'] 中的路径是否正确")
        sys.exit(1)
    
    logger.info(f"找到 {len(input_files)} 个图片文件")
    
    # 使用配置文件中的裁剪设置
    crop_config = CROP_CONFIG.copy()
    
    # 显示配置信息
    print(f"📁 输入文件: {len(input_files)} 个")
    print(f"📂 输出目录: {INPUT_CONFIG['output_directory'] or '与输入文件同目录'}")
    
    if CROP_CONFIG['crop_mode'] == 'box':
        crop_box = CROP_CONFIG['crop_box']
        print(f"✂️ 裁剪模式: 区域裁剪 ({crop_box[0]}, {crop_box[1]}, {crop_box[2]}, {crop_box[3]})")
    elif CROP_CONFIG['crop_mode'] == 'percentage':
        h_percent = CROP_CONFIG['horizontal_percent']
        v_percent = CROP_CONFIG['vertical_percent']
        print(f"✂️ 裁剪模式: 百分比裁剪 (水平{h_percent*100:.1f}%, 垂直{v_percent*100:.1f}%)")
    
    print("="*50)
    
    # 执行裁剪
    success_count, failed_count = cropper.crop_multiple_files(
        input_files, INPUT_CONFIG['output_directory'], crop_config
    )
    
    # 打印结果
    print("\n" + "="*50)
    print("🎉 裁剪完成!")
    print(f"✅ 成功: {success_count} 个文件")
    print(f"❌ 失败: {failed_count} 个文件")
    print("💡 裁剪后的文件会添加 '_cropped' 后缀")
    print("="*50)


if __name__ == '__main__':
    main()
