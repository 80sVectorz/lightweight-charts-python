import {
	CustomSeriesOptions,
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	customSeriesDefaultOptions,
	CandlestickSeriesOptions,
	WhitespaceData,
	Time,
	LineStyle,
	LineWidth,
	CandlestickData
} from 'lightweight-charts';
import { ohlcSeriesRenderer} from './renderer';
import {

} from 'lightweight-charts';

export interface ohlcSeriesOptions
	extends CustomSeriesOptions,
		Exclude<
			CandlestickSeriesOptions,
			'borderColor'
		> {
	radius: (barSpacing: number) => number;
	shape:'Rectangle'|'Rounded'|'Ellipse'|'Arrow'|'Polygon'|'3d';
	chandelierSize: number 
	barSpacing: number 
	lineStyle: LineStyle
	lineWidth: LineWidth 
		}
	//upperUpColor: string|undefined
	//upperDownColor: string|undefined
	//lowerUpColor: string|undefined
	//lowerDownColor: string|undefined
export const ohlcdefaultOptions: ohlcSeriesOptions = {
	...customSeriesDefaultOptions,
	upColor: '#26a69a',
	downColor: '#ef5350',
	wickVisible: true,
	borderVisible: true,
	borderColor: '#378658',
	borderUpColor: '#26a69a',
	borderDownColor: '#ef5350',
	wickColor: '#737375',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
	radius: function (bs: number) {
		if (bs < 4) return 0;
		return bs / 3;
	},
	shape: 'Rectangle',  // Default shape
	chandelierSize: 1,
	barSpacing: 0.8,
	lineStyle: 0 as LineStyle,
	lineWidth: 1 as  LineWidth

} as const;
	//upperUpColor: undefined,
	//upperDownColor: undefined,
	//lowerUpColor: undefined,
	//lowerDownColor: undefined,
export class ohlcSeries<TData extends ohlcSeriesData>
	implements ICustomSeriesPaneView<Time, TData, ohlcSeriesOptions>
{
	_renderer: ohlcSeriesRenderer<TData>;

	constructor() {
		this._renderer = new ohlcSeriesRenderer();
	}

	priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [plotRow.high, plotRow.low, plotRow.close];
	}

	renderer(): ohlcSeriesRenderer<TData> {
		return this._renderer;
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return (data as Partial<TData>).close === undefined;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: ohlcSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return ohlcdefaultOptions;
	}
}

export interface ohlcSeriesData extends CandlestickData {
    time: Time;       // The time of the candle, typically required by the chart
    open: number;     // Opening price
    high: number;     // Highest price
    low: number;      // Lowest price
    close: number;    // Closing price

    // Optional customization properties
    color?: string;         // Optional fill color for the candle body
    borderColor?: string;   // Optional color for the candle border
    wickColor?: string;     // Optional color for the candle wicks
    shape?: string;         // Optional shape (e.g., 'Rectangle', 'Rounded', 'Ellipse', 'Arrow', '3d', 'Polygon')
    lineStyle?: number;     // Optional line style (e.g., solid, dashed)
    lineWidth?: number;     // Optional line width for the border or wick
}
