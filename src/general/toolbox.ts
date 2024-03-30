import { DrawingTool } from "../drawing/drawing-tool";
import { TrendLine } from "../trend-line/trend-line";
import { Box } from "../box/box";
import { Drawing } from "../drawing/drawing";
import { ContextMenu } from "../context-menu/context-menu";
import { GlobalParams } from "./global-params";
import { StylePicker } from "../context-menu/style-picker";
import { ColorPicker } from "../context-menu/color-picker";
import { IChartApi, ISeriesApi, SeriesType } from "lightweight-charts";
import { TwoPointDrawing } from "../drawing/two-point-drawing";
import { HorizontalLine } from "../horizontal-line/horizontal-line";
import { RayLine } from "../horizontal-line/ray-line";


interface Icon {
    div: HTMLDivElement,
    group: SVGGElement,
    type: new (...args: any[]) => Drawing
}

declare const window: GlobalParams

export class ToolBox {
    private static readonly TREND_SVG: string = '<rect x="3.84" y="13.67" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -5.9847 14.4482)" width="21.21" height="1.56"/><path d="M23,3.17L20.17,6L23,8.83L25.83,6L23,3.17z M23,7.41L21.59,6L23,4.59L24.41,6L23,7.41z"/><path d="M6,20.17L3.17,23L6,25.83L8.83,23L6,20.17z M6,24.41L4.59,23L6,21.59L7.41,23L6,24.41z"/>';
    private static readonly HORZ_SVG: string = '<rect x="4" y="14" width="9" height="1"/><rect x="16" y="14" width="9" height="1"/><path d="M11.67,14.5l2.83,2.83l2.83-2.83l-2.83-2.83L11.67,14.5z M15.91,14.5l-1.41,1.41l-1.41-1.41l1.41-1.41L15.91,14.5z"/>';
    private static readonly RAY_SVG: string = '<rect x="8" y="14" width="17" height="1"/><path d="M3.67,14.5l2.83,2.83l2.83-2.83L6.5,11.67L3.67,14.5z M7.91,14.5L6.5,15.91L5.09,14.5l1.41-1.41L7.91,14.5z"/>';
    private static readonly BOX_SVG: string = '<rect x="8" y="6" width="12" height="1"/><rect x="9" y="22" width="11" height="1"/><path d="M3.67,6.5L6.5,9.33L9.33,6.5L6.5,3.67L3.67,6.5z M7.91,6.5L6.5,7.91L5.09,6.5L6.5,5.09L7.91,6.5z"/><path d="M19.67,6.5l2.83,2.83l2.83-2.83L22.5,3.67L19.67,6.5z M23.91,6.5L22.5,7.91L21.09,6.5l1.41-1.41L23.91,6.5z"/><path d="M19.67,22.5l2.83,2.83l2.83-2.83l-2.83-2.83L19.67,22.5z M23.91,22.5l-1.41,1.41l-1.41-1.41l1.41-1.41L23.91,22.5z"/><path d="M3.67,22.5l2.83,2.83l2.83-2.83L6.5,19.67L3.67,22.5z M7.91,22.5L6.5,23.91L5.09,22.5l1.41-1.41L7.91,22.5z"/><rect x="22" y="9" width="1" height="11"/><rect x="6" y="9" width="1" height="11"/>';
    // private static readonly VERT_SVG: string = '';

    div: HTMLDivElement;
    private activeIcon: Icon | null = null;

    private buttons: HTMLDivElement[] = [];

    private _commandFunctions: Function[];
    private _handlerID: string;

    private _drawingTool: DrawingTool;

    constructor(handlerID: string, chart: IChartApi, series: ISeriesApi<SeriesType>, commandFunctions: Function[]) {
        this._handlerID = handlerID;
        this._commandFunctions = commandFunctions;
        this._drawingTool = new DrawingTool(chart, series, () => this.removeActiveAndSave());
        this.div = this._makeToolBox()
        this._makeContextMenu();

        commandFunctions.push((event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.code === 'KeyZ') {
                const drawingToDelete = this._drawingTool.drawings.pop();
                if (drawingToDelete) this._drawingTool.delete(drawingToDelete)
                return true;
            }
            return false;
        });
    }

    toJSON() {
        // Exclude the chart attribute from serialization
        const { ...serialized} = this;
        return serialized;
    }

    private _makeToolBox() {
        let div = document.createElement('div')
        div.classList.add('toolbox');
        this.buttons.push(this._makeToolBoxElement(TrendLine, 'KeyT', ToolBox.TREND_SVG))
        this.buttons.push(this._makeToolBoxElement(HorizontalLine, 'KeyH', ToolBox.HORZ_SVG));
        this.buttons.push(this._makeToolBoxElement(RayLine, 'KeyR', ToolBox.RAY_SVG));
        this.buttons.push(this._makeToolBoxElement(Box, 'KeyB', ToolBox.BOX_SVG));
        for (const button of this.buttons) {
            div.appendChild(button);
        }
        return div
    }

    private _makeToolBoxElement(DrawingType: new (...args: any[]) => Drawing, keyCmd: string, paths: string) {
        const elem = document.createElement('div')
        elem.classList.add("toolbox-button");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "29");
        svg.setAttribute("height", "29");

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.innerHTML = paths
        group.setAttribute("fill", window.pane.color)

        svg.appendChild(group)
        elem.appendChild(svg);

        const icon: Icon = {div: elem, group: group, type: DrawingType}

        elem.addEventListener('click', () => this._onIconClick(icon));

        this._commandFunctions.push((event: KeyboardEvent) => {
            if (this._handlerID !== window.handlerInFocus) return false;

            if (event.altKey && event.code === keyCmd) {
                event.preventDefault()
                this._onIconClick(icon);
                return true
            }
            return false;
        })
        return elem
    }

    private _onIconClick(icon: Icon) {
        if (this.activeIcon) {

            this.activeIcon.div.classList.remove('active-toolbox-button');
            window.setCursor('crosshair');
            this._drawingTool?.stopDrawing()
            if (this.activeIcon === icon) {
                this.activeIcon = null
                return 
            }
        }
        this.activeIcon = icon
        this.activeIcon.div.classList.add('active-toolbox-button')
        window.setCursor('crosshair');
        this._drawingTool?.beginDrawing(this.activeIcon.type);
    }

    removeActiveAndSave() {
        window.setCursor('default');
        if (this.activeIcon) this.activeIcon.div.classList.remove('active-toolbox-button')
        this.activeIcon = null
        this.saveDrawings()
    }

    private _makeContextMenu() {
        const contextMenu = new ContextMenu()
        const colorPicker = new ColorPicker(this.saveDrawings)
        const stylePicker = new StylePicker(this.saveDrawings)

        let onClickDelete = () => this._drawingTool.delete(Drawing.lastHoveredObject);
        let onClickColor = (rect: DOMRect) => colorPicker.openMenu(rect)
        let onClickStyle = (rect: DOMRect) => stylePicker.openMenu(rect)

        contextMenu.menuItem('Color Picker', onClickColor, () => {
            document.removeEventListener('click', colorPicker.closeMenu)
            colorPicker._div.style.display = 'none'
        })
        contextMenu.menuItem('Style', onClickStyle, () => {
            document.removeEventListener('click', stylePicker.closeMenu)
            stylePicker._div.style.display = 'none'
        })
        contextMenu.separator()
        contextMenu.menuItem('Delete Drawing', onClickDelete)
    }

    // renderDrawings() {
        // if (this.mouseDown) return
        // this.drawings.forEach((item) => {
        //     if ('price' in item) return
        //     let startDate = Math.round(item.from[0]/this.chart.interval)*this.chart.interval
        //     let endDate = Math.round(item.to[0]/this.chart.interval)*this.chart.interval
        //     item.calculateAndSet(startDate, item.from[1], endDate, item.to[1])
        // })
    // }

    addNewDrawing(d: Drawing) {
        this._drawingTool.addNewDrawing(d);
    }

    clearDrawings() {
        this._drawingTool.clearDrawings();
    }

    saveDrawings() {
        const drawingMeta = []
        for (const d of this._drawingTool.drawings) {
            if (d instanceof TwoPointDrawing) {
                drawingMeta.push({
                    type: d._type,
                    p1: d._p1,
                    p2: d._p2,
                    color: d._options.lineColor,
                    style: d._options.lineStyle,    // TODO should push all options, just dont have showcircles/ non public stuff as actual options
                                                    //      would also fix the instanceOf in loadDrawings
                })
            }
            // TODO else if d instanceof Drawing
        }
        const string = JSON.stringify(drawingMeta);
        window.callbackFunction(`save_drawings${this._handlerID}_~_${string}`)
    }

    loadDrawings(drawings: any[]) { // TODO any?
        drawings.forEach((d) => {
            const options = {
                lineColor: d.color,
                lineStyle: d.style,
            }
            switch (d.type) {
                case "Box":
                    this._drawingTool.addNewDrawing(new Box(d.p1, d.p2, options));
                    break;
                case "TrendLine":
                    this._drawingTool.addNewDrawing(new TrendLine(d.p1, d.p2, options));
                    break;
                // TODO case HorizontalLine
            }
        })
    }
}