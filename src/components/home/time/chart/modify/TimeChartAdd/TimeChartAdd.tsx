'use client';

import { type ChartSize, timeToDegree } from '@/utils/chart';
import {
	differenceTime,
	formatDisplayTime,
	toSecondsByMilliseconds,
} from '@/utils/date';
import { ROTATE_DEG } from '@/utils/size';
import { deepCopy } from '@/utils/util';
import { Time } from '@prisma/client';
import {
	ForwardedRef,
	forwardRef,
	MouseEvent,
	useEffect,
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

type Props = {
	times: Time[];
};

type HoverChartPiece = CustomPath2D & {
	x: number;
	y: number;
};

// 새로 적용할 color
// rgb(161, 161, 161)
// bg rgb(10, 10, 10)
export function TimeAddChartFoward(
	{ times }: Props,
	ref?: ForwardedRef<HTMLDivElement>
) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [chartWidth, setChartWidth] = useState<ChartSize>(300);
	const [path2Ds, setPath2Ds] = useState<CustomPath2D[]>([]);
	const [hoverCustomPath2D, setHoverCustomPath2D] =
		useState<HoverChartPiece | null>(null);

	const onClickCanvas = (e: MouseEvent) => {
		const { offsetY, offsetX, pageX, pageY } = e.nativeEvent;

		const ctx = canvasRef.current?.getContext('2d');

		if (ctx) {
			let hoveredObj: CustomPath2D | null = null;
			path2Ds.forEach((obj) => {
				const path2D = obj.path2D;
				const { r, g, b } = obj.rgba;
				if (ctx.isPointInPath(path2D, offsetX, offsetY)) {
					//const isInPath = ctx.isPointInPath(path2D, offsetX, offsetY);
					hoveredObj = obj;
					// 흰색 호를 그려서 투명색을 조정
					ctx.fillStyle = 'white';
					ctx.strokeStyle = 'white';
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

			if (hoveredObj !== null) {
				setHoverCustomPath2D((state) => {
					return {
						...deepCopy(hoveredObj as CustomPath2D),
						x: offsetX,
						y: offsetY,
					};
				});
			} else {
				setHoverCustomPath2D(null);
			}

			//drawChartMiddleCycle(ctx);
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

			//drawChartMiddleCycle(ctx);
		}

		// hover된 객체 제거
		setHoverCustomPath2D(null);
	};

	useLayoutEffect(() => {
		const mediaQuery = window.matchMedia('screen and (min-width:640px)');
		const mbileMediaQuery = window.matchMedia('screen and (min-width:390px)');
		const changeCB = () => {
			if (mediaQuery.matches) {
				setChartWidth(600);
			} else {
				if (mbileMediaQuery.matches) {
					setChartWidth(300);
				} else {
					setChartWidth(250);
				}
			}
		};
		changeCB();
		mediaQuery.addEventListener('change', changeCB);
		mbileMediaQuery.addEventListener('change', changeCB);

		return () => {
			mediaQuery.removeEventListener('change', changeCB);
			mbileMediaQuery.removeEventListener('change', changeCB);
		};
	}, []);

	useEffect(() => {
		if (!times) return;
		if (!canvasRef.current) return;

		// canvas 초기화
		canvasRef.current
			.getContext('2d')
			?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

		const ctx = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
		const startX = parseInt(String(chartWidth / 2));
		const customPath2dList: CustomPath2D[] = [];

		for (let i = 0, index = 0; i < times.length; i++) {
			// timer가 진행중이면 cancel
			if (!times[i].endTime) continue;

			const currentTime = times[i];
			const path = new Path2D();
			// 색상을 규칙적을 뽑는 인덱스
			const paletteIndex = index % colorPalette.length;

			index++;
			ctx.beginPath();
			// ctx.lineWidth = 30;
			path.moveTo(startX, startX);
			// 시작을 12시 방향부터 시작하기위해 -90를 회전시킴 그 코드는 - Math.PI / 2를 추가
			path.arc(
				startX,
				startX,
				chartWidth / 2,
				+((Math.PI / 180) * timeToDegree(currentTime.startTime)).toFixed(2) -
					Math.PI / 2,
				+((Math.PI / 180) * timeToDegree(currentTime.endTime!)).toFixed(2) -
					Math.PI / 2
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
				startTimeObj: currentTime,
				startTime: currentTime.startTime,
				endTimeObj: currentTime,
				endTime: currentTime.endTime!,
			});
		}

		setPath2Ds(customPath2dList);
	}, [canvasRef, chartWidth, times]);

	return (
		<div ref={ref} className="relative">
			<div
				className="relative h-[250px] w-[250px] overflow-hidden rounded-full outline outline-2 outline-h_gray"
				style={{ width: chartWidth, height: chartWidth }}
			>
				<canvas
					ref={canvasRef}
					width={chartWidth}
					height={chartWidth}
					className="absolute z-30"
					onClick={onClickCanvas}
					onMouseMove={onClickCanvas}
					onMouseLeave={onMouseLeaveCanvase}
				></canvas>

				{makeGradution(24)}
				{/* 중앙 동그라미 */}
				<div className="absolute left-1/2 top-1/2 z-50 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-h_black sm:h-[30px] sm:w-[30px]"></div>
			</div>

			{/* hover 팝업 */}
			{hoverCustomPath2D && (
				<div
					className="absolute z-[60] rounded-lg border border-h_gray bg-h_black p-5 text-center text-white"
					style={{
						left: '10px',
						top: '10px',
						transform: `translate3d(calc(${hoverCustomPath2D.x}px + 2.5rem), calc(${hoverCustomPath2D.y}px + 2.5rem), 0)`,
					}}
				>
					<h2>{hoverCustomPath2D.startTimeObj.subject}</h2>
					<p>시작시간: {formatDisplayTime(hoverCustomPath2D.startTime)}</p>
					<p>종료시간: {formatDisplayTime(hoverCustomPath2D.endTime)}</p>
					<p>
						사용시간(분):{' '}
						{Math.floor(
							toSecondsByMilliseconds(
								differenceTime(
									hoverCustomPath2D.startTime,
									hoverCustomPath2D.endTime
								)
							)! / 60
						)}
					</p>
					<p>
						사용시간(초):{' '}
						{toSecondsByMilliseconds(
							differenceTime(
								hoverCustomPath2D.startTime,
								hoverCustomPath2D.endTime
							)
						)}
					</p>
				</div>
			)}
		</div>
	);
}

const TimeChartAdd = forwardRef<HTMLDivElement, Props>(TimeAddChartFoward);
export default TimeChartAdd;

function makeGradution(count: number) {
	const list: JSX.Element[] = [];

	for (let i = 0; i < count; i++) {
		const element = (
			<div
				key={i}
				className={`absolute h-[2px] w-full transform bg-h_gray ${
					ROTATE_DEG[i * 15]
				} top-[calc(50%-1px)]`}
			></div>
		);
		list.push(element);
	}

	return list;
}

export function TimeTest({ times }: Props) {
	return <div className="relative inline-block h-[400px] w-[400px]"></div>;
}
