#!/usr/bin/env python3
"""
Cat Card Game - 图片处理配置文件
修改这里的参数来自定义处理行为

使用方法：
1. 修改 input_files 添加你的图片文件
2. 设置 output_directory (None=保存在输入文件同目录)
3. 调整图片尺寸、AI模型等参数
4. 运行: python tools/process.py
"""

from PIL import Image

# =============================================================================
# 🔧 通用配置
# =============================================================================

COMMON_SETTINGS = {
    # 要运行的脚本配置 - 指定执行哪些操作
    'scripts': 'all',  # 'all'=所有脚本 | []或['bg_only', 'resize_only']=指定脚本
    # 可选的脚本: ['bg_only', 'resize_only']
    
    # 输入文件列表 - 添加你要处理的图片路径
    'input_files': [
        "assets/images/cats/ragdoll.jpg",
        "assets/images/cats/siamese.jpg", 
        "assets/images/cats/american_shorthair.jpg",
        "assets/images/cats/bengal.jpg"
    ],
    
    # 输出目录 - None表示保存在输入文件的同一目录
    'output_directory': None,
    # 'output_directory': "assets/processed/",  # 取消注释以使用统一输出目录
    
    # 文件命名
    'add_suffix_to_filename': True,  # 是否添加尺寸后缀 (如: image_256x256.jpg)
    
    # 支持的图片格式
    'supported_formats': {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'},
    
    # 日志配置
    'log_level': 'INFO',
}

# =============================================================================
# 🖼️ 图片缩放配置
# =============================================================================

RESIZE_SETTINGS = {
    # 目标尺寸 - 游戏卡片标准尺寸
    'target_size': (256, 256),        # 宽x高 像素
    
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
}

# =============================================================================
# 🤖 AI背景移除配置  
# =============================================================================

BACKGROUND_REMOVAL_SETTINGS = {
    # AI模型选择
    'model_name': 'u2net',            # 推荐: u2net (通用), u2net_human_seg (人像)
    
    # 输出格式
    'keep_alpha': True,               # True=透明背景(.png), False=白色背景(.jpg)
    
    # 文件命名
    'background_suffix': '_nobg',     # 背景移除后缀
}

# 可用的AI模型说明:
# 'u2net'           - 通用模型，适合各种场景 (推荐)
# 'u2net_human_seg' - 人像专用，人物照片效果更好
# 'isnet-general-use' - 最高质量，但速度较慢
# 'silueta'         - 速度最快，质量中等

# =============================================================================
# ⚙️ 高级设置 (通常不需要修改)
# =============================================================================

ADVANCED_SETTINGS = {
    'resample_methods': {
        'lanczos': Image.LANCZOS,
        'bicubic': Image.BICUBIC, 
        'bilinear': Image.BILINEAR,
        'nearest': Image.NEAREST,
    },
    'jpeg_save_params': {
        'optimize': True,
        'progressive': True,
    },
    'png_save_params': {
        'optimize': True,
        'compress_level': 9,
    },
}

# =============================================================================
# 🔄 兼容性配置 (保持工具正常工作，请勿修改)
# =============================================================================

# 映射到工具期望的变量名
DEFAULT_INPUT_PATH = COMMON_SETTINGS['input_files']
DEFAULT_OUTPUT_PATH = COMMON_SETTINGS['output_directory']
DEFAULT_TARGET_SIZE = RESIZE_SETTINGS['target_size']
DEFAULT_RESIZE_METHOD = RESIZE_SETTINGS['resize_method']
DEFAULT_JPEG_QUALITY = RESIZE_SETTINGS['jpeg_quality']
AUTO_ADD_SIZE_TO_FILENAME = COMMON_SETTINGS['add_suffix_to_filename']
DEFAULT_SHARPEN_ENABLED = RESIZE_SETTINGS['enable_sharpen']
DEFAULT_ENHANCE_ENABLED = RESIZE_SETTINGS['enable_enhance']
DEFAULT_BG_REMOVE_MODEL = BACKGROUND_REMOVAL_SETTINGS['model_name']
DEFAULT_BG_KEEP_ALPHA = BACKGROUND_REMOVAL_SETTINGS['keep_alpha']
DEFAULT_BG_ADD_SUFFIX = True

# 高级设置映射
RESAMPLE_METHODS = ADVANCED_SETTINGS['resample_methods']
PROGRESSIVE_SCALE_THRESHOLD = RESIZE_SETTINGS['progressive_scale_threshold']
SHARPEN_RADIUS = RESIZE_SETTINGS['sharpen_radius']
SHARPEN_PERCENT = RESIZE_SETTINGS['sharpen_percent']
SHARPEN_THRESHOLD = RESIZE_SETTINGS['sharpen_threshold']
CONTRAST_ENHANCE_FACTOR = RESIZE_SETTINGS['contrast_factor']
COLOR_ENHANCE_FACTOR = RESIZE_SETTINGS['color_factor']
JPEG_SAVE_PARAMS = ADVANCED_SETTINGS['jpeg_save_params']
PNG_SAVE_PARAMS = ADVANCED_SETTINGS['png_save_params']
SUPPORTED_IMAGE_FORMATS = COMMON_SETTINGS['supported_formats']
LOG_LEVEL = COMMON_SETTINGS['log_level']
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'

# 兼容性函数
def parse_size_config(size_config, original_size=None):
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

def generate_output_filename(input_path, output_path, final_size, add_size=None):
    """生成输出文件名"""
    from pathlib import Path
    
    if add_size is None:
        add_size = AUTO_ADD_SIZE_TO_FILENAME
    
    if not add_size:
        return output_path
    
    output_path_obj = Path(output_path)
    size_tag = f"{final_size[0]}x{final_size[1]}"
    stem = output_path_obj.stem
    
    if size_tag not in stem:
        new_stem = f"{stem}_{size_tag}"
        new_output_path = output_path_obj.parent / f"{new_stem}{output_path_obj.suffix}"
        return str(new_output_path)
    
    return output_path

def print_current_config():
    """打印当前配置"""
    print("📋 当前配置信息")
    print("="*50)
    
    # 显示要执行的脚本
    scripts = COMMON_SETTINGS['scripts']
    if scripts == 'all' or (isinstance(scripts, list) and len(scripts) == 0):
        print("🎯 运行脚本: 全部 (移除背景 + 缩放)")
        script_list = ['bg_only', 'resize_only']
    elif isinstance(scripts, list):
        script_names = {'bg_only': '移除背景', 'resize_only': '缩放图片'}
        script_desc = [script_names.get(s, s) for s in scripts]
        print(f"🎯 运行脚本: {' + '.join(script_desc)}")
        script_list = scripts
    else:
        print(f"🎯 运行脚本: {scripts}")
        script_list = [scripts] if isinstance(scripts, str) else []
    
    print(f"📁 输入文件: {len(COMMON_SETTINGS['input_files'])} 个")
    for i, path in enumerate(COMMON_SETTINGS['input_files'], 1):
        print(f"  {i}. {path}")
    print(f"📂 输出目录: {COMMON_SETTINGS['output_directory'] or '与输入文件同目录'}")
    
    if 'resize_only' in script_list:
        print(f"🖼️ 目标尺寸: {RESIZE_SETTINGS['target_size'][0]}x{RESIZE_SETTINGS['target_size'][1]}")
    
    if 'bg_only' in script_list:
        print(f"🤖 AI模型: {BACKGROUND_REMOVAL_SETTINGS['model_name']}")
        print(f"🎨 透明背景: {'是' if BACKGROUND_REMOVAL_SETTINGS['keep_alpha'] else '否'}")
    
    print("="*50)

if __name__ == '__main__':
    print("🎮 Cat Card Game - 图片处理配置")
    print_current_config()
    print("\n💡 使用方法:")
    print("  1. 修改上面的配置参数")
    print("  2. 运行: python tools/process.py")
    print("\n📝 脚本配置说明:")
    print("  • 'all' 或 []: 运行所有脚本 (移除背景 + 缩放)")
    print("  • ['bg_only']: 只移除背景")
    print("  • ['resize_only']: 只缩放图片")
    print("  • ['bg_only', 'resize_only']: 两个脚本都运行")
