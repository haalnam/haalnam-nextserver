'use client';

import { useGetPersonalTodayTime } from '@/hooks/api/time';
import {
  getChartDegrees,
  type ChartSize,
  makeChartGradutionTimeInfo,
  timeToDegree,
} from '@/utils/chart';
import { chartData } from '@/utils/mock/chart/data';
import { ROTATE_DEG } from '@/utils/size';
import { Time } from '@prisma/client';
import {
  MouseEvent,
  MouseEventHandler,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const colorPalette = [
  { r: 33, g: 255, b: 140, a: 100 },
  { r: 33, g: 222, b: 255, a: 100 },
  { r: 33, g: 255, b: 214, a: 100 },
  { r: 33, g: 255, b: 63, a: 100 },
  { r: 33, g: 151, b: 255, a: 100 },
];

function randomIndexInclusive(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function paletteRandomIndex(colorPalette: RGBA[]) {
  return randomIndexInclusive(0, colorPalette.length - 1);
}

/**
 * 이전 Path2D 색상과 겹치면 다시 랜덤 색상 뽑음
 */
function filterDuplicatePrevIndex(
  currentIndex: number,
  customPath2Ds: CustomPath2D[],
  colorPalette: RGBA[]
) {
  if (currentIndex === 0) return paletteRandomIndex(colorPalette);

  const currentColorPaletteIndex = paletteRandomIndex(colorPalette);
  const prevIndex = currentIndex - 1;

  // 현재 인덱스가 배열의 마지막 인덱스인경우
  // 0 번째 인덱스와 이전 인덱스에서 중복을 걸러내야함.
  if (currentIndex === customPath2Ds.length - 1) {
    const colorPaletteIndexOfZeroIndex = customPath2Ds[0].colorPaletteIndex;
    if (colorPaletteIndexOfZeroIndex === currentColorPaletteIndex)
      return filterDuplicatePrevIndex(
        currentIndex,
        customPath2Ds,
        colorPalette
      );
    if (customPath2Ds[prevIndex].colorPaletteIndex === currentColorPaletteIndex)
      return filterDuplicatePrevIndex(
        currentIndex,
        customPath2Ds,
        colorPalette
      );
  }
  ///debugger;
  if (customPath2Ds[prevIndex].colorPaletteIndex !== currentColorPaletteIndex)
    return currentColorPaletteIndex;

  return filterDuplicatePrevIndex(currentIndex, customPath2Ds, colorPalette);
}

type Props = {
  times: Time[];
  a: CustomPath2D;
};

export default function TimeChart({ times }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartWidth, setChartWidth] = useState<ChartSize>(300);
  const [path2Ds, setPath2Ds] = useState<CustomPath2D[]>([]);

  const onClickCanvas = (e: MouseEvent) => {
    const { offsetY, offsetX } = e.nativeEvent;

    const ctx = canvasRef.current?.getContext('2d');

    if (ctx) {
      path2Ds.forEach((obj) => {
        const path2D = obj.path2D;
        const { r, g, b } = obj.rgba;
        if (ctx.isPointInPath(path2D, offsetX, offsetY)) {
          const isInPath = ctx.isPointInPath(path2D, offsetX, offsetY);

          // 흰색 호를 그려서 투명색을 조정
          ctx.fillStyle = 'white';

          ctx.fill(path2D);
          ctx.stroke(path2D);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b}, 0.4)`;
          ctx.fill(path2D);
        } else {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill(path2D);
          ctx.stroke(path2D);
        }
      });

      drawChartMiddleCycle(ctx);
    }
  };

  const onMouseLeaveCanvase = (e: MouseEvent) => {
    const ctx = canvasRef.current?.getContext('2d');

    if (ctx) {
      path2Ds.forEach((obj) => {
        const path2D = obj.path2D;
        const { r, g, b } = obj.rgba;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`; //채울 색상
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill(path2D);
        ctx.stroke(path2D);
      });

      drawChartMiddleCycle(ctx);
    }
  };

  const drawChartMiddleCycle = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // 차트 가운데 동그라미 그리기
      const startPoint = parseInt(String(chartWidth / 2));
      ctx.save();
      ctx.fillStyle = '#6b7280';
      ctx.arc(
        startPoint,
        startPoint,
        startPoint / 30,
        0,
        (Math.PI / 180) * 360
      );
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    },
    [chartWidth]
  );

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('screen and (min-width:640px)');
    const changeCB = () => {
      if (mediaQuery.matches) {
        setChartWidth(600);
      } else {
        setChartWidth(300);
      }
    };
    if (mediaQuery.matches) {
      setChartWidth(600);
    } else {
      setChartWidth(300);
    }
    mediaQuery.addEventListener('change', changeCB);

    return () => {
      mediaQuery.removeEventListener('change', changeCB);
    };
  }, []);

  useLayoutEffect(() => {
    if (!times) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
    const startX = parseInt(String(chartWidth / 2));
    const customPath2dList: CustomPath2D[] = [];

    for (let i = 0, index = 0; i < times.length; i++) {
      if (i % 2 !== 0) continue;

      // 데이터가 홀수 이고 마지막이 시작으로 끝나는 경우 캔슬
      if (times.length % 2 && i === times.length - 1) continue;
      const path = new Path2D();
      // 랜덤으로 색상을 뽑아주는 인덱스
      // const paletteIndex = filterDuplicatePrevIndex(
      //   customPath2dList.length,
      //   customPath2dList,
      //   colorPalette
      // );

      // 색상을 규칙적을 뽑는 인덱스
      const paletteIndex = index % colorPalette.length;

      index++;
      ctx.beginPath();
      // ctx.lineWidth = 30;
      path.moveTo(startX, startX);
      path.arc(
        startX,
        startX,
        chartWidth / 2,
        +((Math.PI / 180) * timeToDegree(times[i].time)).toFixed(2),
        +((Math.PI / 180) * timeToDegree(times[i + 1].time)).toFixed(2)
      );

      ctx.fillStyle = `rgb(${colorPalette[paletteIndex].r}, ${colorPalette[paletteIndex].g}, ${colorPalette[paletteIndex].b})`; //채울 색상
      ctx.strokeStyle = `rgb(${colorPalette[paletteIndex].r}, ${colorPalette[paletteIndex].g}, ${colorPalette[paletteIndex].b})`; //채울 색상
      ctx.fill(path); //채우기
      ctx.stroke(path); //테두리
      path.closePath();
      customPath2dList.push({
        path2D: path,
        rgba: colorPalette[paletteIndex],
        colorPaletteIndex: paletteIndex,
      });
    }
    drawChartMiddleCycle(ctx);
    setPath2Ds(customPath2dList);
  }, [canvasRef, chartWidth, times]);

  return (
    <div className='relative p-10'>
      {/* 눈금 별 시간 표시 */}
      {makeChartGradutionTimeInfo((chartWidth + 45) / 2).map((v) => {
        return (
          <div
            suppressHydrationWarning
            key={JSON.stringify(v)}
            className='absolute text-2xl'
            style={{
              transform: `translate(${v.x + chartWidth / 2}px, ${
                v.y + chartWidth / 2
              }px) translate(-50%, -50%)`,
            }}
          >
            {v.time}
          </div>
        );
      })}
      <div className='w-[300px] h-[300px] outline outline-2 outline-black rounded-full relative overflow-hidden  sm:w-[600px] sm:h-[600px]'>
        <canvas
          ref={canvasRef}
          width={chartWidth}
          height={chartWidth}
          className='absolute z-30 cursor-pointer '
          onClick={onClickCanvas}
          onMouseMove={onClickCanvas}
          onMouseLeave={onMouseLeaveCanvase}
        ></canvas>
        {makeGradution(24)}
        <div className='w-[20px] h-[20px] sm:w-[30px] sm:h-[30px]  absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-500 border border-black'></div>
      </div>
    </div>
  );
}

function makeGradution(count: number) {
  const list: JSX.Element[] = [];

  for (let i = 0; i < count; i++) {
    const element = (
      <div
        key={i}
        className={`absolute w-full h-[2px] bg-black transform ${
          ROTATE_DEG[i * 15]
        } top-[calc(50%-1px)]`}
      ></div>
    );
    list.push(element);
  }

  return list;
}
