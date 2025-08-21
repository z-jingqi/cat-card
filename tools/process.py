#!/usr/bin/env python3
"""
Cat Card Game - 图片处理工具
根据 tools/config.py 中的配置进行图片处理

运行脚本（在配置文件中设置）：
- 'all' 或 []: 移除背景 + 缩放 (制作游戏卡片)  
- ['bg_only']: 只移除背景
- ['resize_only']: 只缩放图片
- ['bg_only', 'resize_only']: 指定多个脚本

所有配置在 tools/config.py 中设置
"""

import sys
import os
from pathlib import Path

# 设置tools目录
tools_dir = Path(__file__).parent
sys.path.insert(0, str(tools_dir))

def check_and_setup_environment():
    """检查并设置环境"""
    print("🔍 检查环境...")
    
    # 检查虚拟环境
    venv_dir = tools_dir / "venv"
    if not venv_dir.exists():
        print("📦 首次运行，正在设置环境...")
        return setup_environment()
    
    print("✅ 环境检查通过")
    return True

def setup_environment():
    """设置Python环境"""
    import subprocess
    import platform
    
    try:
        # 确定Python解释器
        python_cmd = sys.executable
        
        # 创建虚拟环境
        venv_dir = tools_dir / "venv"
        print("📦 创建虚拟环境...")
        result = subprocess.run([python_cmd, "-m", "venv", str(venv_dir)], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ 创建虚拟环境失败: {result.stderr}")
            return False
        
        # 确定虚拟环境中的Python和pip路径
        if platform.system() == "Windows":
            venv_python = venv_dir / "Scripts" / "python.exe"
            venv_pip = venv_dir / "Scripts" / "pip.exe"
        else:
            venv_python = venv_dir / "bin" / "python"
            venv_pip = venv_dir / "bin" / "pip"
        
        # 升级pip
        print("📈 升级pip...")
        subprocess.run([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], 
                      capture_output=True, text=True)
        
        # 安装依赖
        print("📦 安装依赖包...")
        requirements_file = tools_dir / "requirements.txt"
        result = subprocess.run([str(venv_pip), "install", "-r", str(requirements_file)], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ 安装依赖失败: {result.stderr}")
            return False
        
        print("✅ 环境设置完成!")
        return True
        
    except Exception as e:
        print(f"❌ 环境设置出错: {e}")
        return False

def load_config():
    """加载配置"""
    try:
        from config import (
            COMMON_SETTINGS,
            RESIZE_SETTINGS, 
            BACKGROUND_REMOVAL_SETTINGS
        )
        return {
            'common': COMMON_SETTINGS,
            'resize': RESIZE_SETTINGS,
            'bg_removal': BACKGROUND_REMOVAL_SETTINGS
        }
    except ImportError as e:
        print(f"❌ 加载配置失败: {e}")
        return None

def get_script_list(scripts_config):
    """根据配置获取要运行的脚本列表"""
    if scripts_config == 'all' or (isinstance(scripts_config, list) and len(scripts_config) == 0):
        return ['bg_only', 'resize_only']
    elif isinstance(scripts_config, list):
        return scripts_config
    elif isinstance(scripts_config, str):
        return [scripts_config]
    else:
        return ['bg_only', 'resize_only']  # 默认运行所有

def run_with_venv():
    """使用虚拟环境重新运行脚本"""
    import subprocess
    import platform
    
    venv_dir = tools_dir / "venv"
    if venv_dir.exists():
        if platform.system() == "Windows":
            venv_python = venv_dir / "Scripts" / "python.exe"
        else:
            venv_python = venv_dir / "bin" / "python"
        
        if venv_python.exists():
            # 使用虚拟环境的Python重新运行当前脚本
            current_script = Path(__file__)
            result = subprocess.run([str(venv_python), str(current_script)], 
                                  env={**os.environ, "VENV_ACTIVE": "1"})
            sys.exit(result.returncode)

def process_images(scripts_to_run, config):
    """处理图片"""
    try:
        from image_resizer import HighQualityResizer
        from background_remover import BackgroundRemover
    except ImportError as e:
        # 如果不在虚拟环境中，尝试使用虚拟环境重新运行
        if not os.environ.get("VENV_ACTIVE"):
            print(f"❌ 导入工具模块失败: {e}")
            print("🔄 尝试使用虚拟环境重新运行...")
            run_with_venv()
        
        print(f"❌ 导入工具模块失败: {e}")
        print("💡 提示: 请删除tools/venv文件夹，重新运行脚本")
        return False
    
    # 获取输入文件
    input_files = config['common']['input_files']
    output_dir = config['common']['output_directory']
    
    print(f"📁 找到 {len(input_files)} 个输入文件")
    print(f"📂 输出目录: {output_dir or '与输入文件同目录'}")
    
    processed_count = 0
    failed_count = 0
    
    for input_file in input_files:
        input_path = Path(input_file)
        if not input_path.exists():
            print(f"⚠️ 文件不存在，跳过: {input_file}")
            continue
        
        print(f"\n🚀 处理文件: {input_path.name}")
        
        try:
            # 确定输出路径
            if output_dir:
                output_path = Path(output_dir)
                output_path.mkdir(parents=True, exist_ok=True)
            else:
                output_path = input_path.parent
            
            current_file = str(input_path)
            
            # 第一步：移除背景
            if 'bg_only' in scripts_to_run:
                print("🤖 移除背景...")
                
                remover = BackgroundRemover(model_name=config['bg_removal']['model_name'])
                
                # 构建背景移除后的文件名
                bg_suffix = config['bg_removal']['background_suffix']
                if config['bg_removal']['keep_alpha']:
                    bg_output = output_path / f"{input_path.stem}{bg_suffix}.png"
                else:
                    bg_output = output_path / f"{input_path.stem}{bg_suffix}{input_path.suffix}"
                
                success = remover.remove_background(
                    current_file,
                    str(bg_output),
                    keep_alpha=config['bg_removal']['keep_alpha']
                )
                
                if success:
                    print(f"✅ 背景移除完成: {bg_output.name}")
                    current_file = str(bg_output)  # 更新当前文件路径用于下一步
                else:
                    print("❌ 背景移除失败")
                    failed_count += 1
                    continue
            
            # 第二步：缩放
            if 'resize_only' in scripts_to_run:
                print("🖼️ 缩放图片...")
                
                resizer = HighQualityResizer()
                
                # 如果只运行缩放脚本，直接使用原文件
                if scripts_to_run == ['resize_only']:
                    current_file = str(input_path)
                
                # 构建缩放后的文件名
                if config['common']['add_suffix_to_filename']:
                    size = config['resize']['target_size']
                    current_path = Path(current_file)
                    final_output = output_path / f"{current_path.stem}_{size[0]}x{size[1]}{current_path.suffix}"
                else:
                    current_path = Path(current_file)
                    final_output = output_path / f"{current_path.stem}{current_path.suffix}"
                
                success = resizer.resize_image(
                    current_file,
                    str(final_output),
                    config['resize']['target_size'],
                    method=config['resize']['resize_method'],
                    sharpen=config['resize']['enable_sharpen'],
                    enhance_quality=config['resize']['enable_enhance'],
                    quality=config['resize']['jpeg_quality']
                )
                
                if success:
                    print(f"✅ 缩放完成: {final_output.name}")
                else:
                    print("❌ 缩放失败")
                    failed_count += 1
                    continue
            
            processed_count += 1
            
        except Exception as e:
            print(f"❌ 处理文件时出错: {e}")
            failed_count += 1
    
    # 打印总结
    print("\n" + "="*60)
    print("📊 处理完成!")
    print("="*60)
    print(f"✅ 成功处理: {processed_count} 个文件")
    print(f"❌ 处理失败: {failed_count} 个文件")
    
    # 根据执行的脚本显示完成信息
    if set(scripts_to_run) == {'bg_only', 'resize_only'}:
        print("🎮 游戏卡片制作完成! 可以在游戏中使用了")
    elif scripts_to_run == ['bg_only']:
        print("🤖 背景移除完成!")
    elif scripts_to_run == ['resize_only']:
        print("🖼️ 图片缩放完成!")
    else:
        script_names = {'bg_only': '背景移除', 'resize_only': '图片缩放'}
        completed_scripts = [script_names.get(s, s) for s in scripts_to_run]
        print(f"✨ {' + '.join(completed_scripts)} 完成!")
    
    print("="*60)
    
    return failed_count == 0

def main():
    """主函数"""
    print("🎮 Cat Card Game - 图片处理工具")
    print("="*60)
    
    # 检查环境 (仅在非虚拟环境下)
    if not os.environ.get("VENV_ACTIVE"):
        if not check_and_setup_environment():
            sys.exit(1)
    
    # 加载配置
    config = load_config()
    if not config:
        sys.exit(1)
    
    # 从配置获取要运行的脚本
    scripts_config = config['common'].get('scripts', 'all')
    scripts_to_run = get_script_list(scripts_config)
    
    # 显示要运行的脚本
    if set(scripts_to_run) == {'bg_only', 'resize_only'}:
        script_desc = "移除背景 + 缩放"
    else:
        script_names = {'bg_only': '移除背景', 'resize_only': '缩放图片'}
        script_desc = ' + '.join([script_names.get(s, s) for s in scripts_to_run])
    
    print(f"🎯 运行脚本: {script_desc}")
    print("="*60)
    
    # 显示配置信息
    print(f"📁 输入文件: {len(config['common']['input_files'])} 个")
    if 'resize_only' in scripts_to_run:
        size = config['resize']['target_size']
        print(f"🖼️ 目标尺寸: {size[0]}x{size[1]}")
    if 'bg_only' in scripts_to_run:
        model = config['bg_removal']['model_name']
        alpha = "透明背景" if config['bg_removal']['keep_alpha'] else "白色背景"
        print(f"🤖 AI模型: {model} ({alpha})")
    
    # 处理图片
    success = process_images(scripts_to_run, config)
    
    if not success:
        print("\n💡 提示:")
        print("  • 检查输入文件路径是否正确")
        print("  • 确保有足够的磁盘空间")
        print("  • 第一次使用AI模型需要下载模型文件")
        sys.exit(1)

if __name__ == '__main__':
    main()
