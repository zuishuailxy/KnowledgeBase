import { useEffect, useState } from "react"

export interface WatermarkOptions {
  content: string // 水印文本
  width?: number  // 水印宽度
  height?: number // 水印高度
  fontSize?: number // 水印字体大小
  fontColor?: string // 水印字体颜色
  zIndex?: number // 水印层级
  rotate?: number // 水印旋转角度
  gapX?: number // 水印横向间距
  gapY?: number // 水印纵向间距
}

const defaultOptions = (): Partial<WatermarkOptions> => {
  const { width, height } = document.documentElement.getBoundingClientRect();

  return {
    width,
    height,
    fontSize: 16,
    fontColor: 'black',
    zIndex: 9999,
    rotate: -30,
    gapX: 200,
    gapY: 100
  }
}

export const useWatermark = (options: WatermarkOptions) => {
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>(options);
  const opts = { ...defaultOptions(), ...watermarkOptions };

  const updateWatermark = (newOptions: Partial<WatermarkOptions>) => {
    setWatermarkOptions(prev => ({ ...prev, ...newOptions }));
  }

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = opts.gapX!;
    canvas.height = opts.gapY!;

    // 绘制水印
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((Math.PI / 180) * opts.rotate!);
    ctx.font = `${opts.fontSize}px sans-serif`;
    ctx.fillStyle = opts.fontColor!;
    ctx.globalAlpha = 0.15;
    ctx.fillText(opts.content, 0, 0);

    const watermarkDiv = document.createElement('div');
    watermarkDiv.style.position = 'fixed';
    watermarkDiv.style.top = '0';
    watermarkDiv.style.left = '0';
    watermarkDiv.style.width = '100%';
    watermarkDiv.style.height = '100%';
    watermarkDiv.style.pointerEvents = 'none';
    watermarkDiv.style.zIndex = opts.zIndex!.toString();
    watermarkDiv.style.backgroundImage = `url(${canvas.toDataURL()})`;
    watermarkDiv.style.backgroundRepeat = 'repeat';
    watermarkDiv.style.backgroundPosition = '0 0';
    watermarkDiv.style.backgroundSize = `${opts.gapX}px ${opts.gapY}px`;
    document.body.appendChild(watermarkDiv);

    return () => {
      if (watermarkDiv.parentNode) {
        watermarkDiv.parentNode.removeChild(watermarkDiv);
      }
    }

  }, [opts]);

  return [updateWatermark, opts] as const;
}