// Generated file; run `make types` to update.
declare type CMYColour = [number, number, number];
declare type CMYKColour = [number, number, number, number];
declare type CommandList = Array<(string|Array<string>)>;
declare type DrawTextResult = {x: number; y: number; remainder: string[]};
declare type ExecOptions = string | {cwd?: string; encoding?: string[] | string; env?: object; outputPath?: string};
declare type ExecResult = {code?: number; stdout?: string; stderr?: string};
declare type FontStyle = {fontFamily: string; fontSize: string; fontVariant: string; fontWeight: string; lineHeight: string};
declare type HSLColour = [number, number, number];
declare type HSVColour = [number, number, number];
declare type ParsedURL = {protocol: string; path: string; filename: string; query: string; fragment: string};
declare type Point = [number, number];
declare type RGBColour = [number, number, number];
declare type WSFrame = {isFinal: boolean; isRSV1: boolean; isRSV2: boolean; isRSV3: boolean; length: BigInt; mask: number; opcode: number; opname: string; payload: number[]};
export declare const BlendModes:{[key: string]: (...args: number[]) => number};
export declare function New(type: string, attr?: object): Element;
export declare function addTo(parent: Node): Function;
export declare function adler32(bytes: number[]): number;
export declare function alignText(input: string, width: number, axis?: number, char?: string): string;
export declare function alphabetiseProperties(input: object, strictCase?: boolean): object;
export declare function angleTo(a: Point, b: Point): number;
export declare function base64Decode(data: string): number[];
export declare function base64Encode(bytes: number[]): string;
export declare function bindMethods(subject: object): object;
export declare function buildDict(dl: HTMLDListElement, valueKey?: boolean, filter?: Function | RegExp): object;
export declare function byteCount(value: number, byteSize?: number): number;
export declare function bytesToUInt16(bytes: number[], littleEndian?: boolean): number[];
export declare function bytesToUInt32(bytes: number[], littleEndian?: boolean): number[];
export declare function bytesToUInt64(bytes: number[], littleEndian?: boolean): BigInt[];
export declare function camelToKebabCase(input: string): string;
export declare function chain(...values: any[]): Promise<any>;
export declare function clamp(input: number, min: number, max: number): number;
export declare function cmyToCMYK(input: CMYColour): CMYKColour;
export declare function cmyToRGB(input: CMYColour): RGBColour;
export declare function cmykToCMY(input: CMYKColour): CMYColour;
export declare function cmykToRGB(input: CMYKColour): RGBColour;
export declare function collectStrings(input: any[] | string, refs?: WeakSet<object>): string[];
export declare function collectTextNodes(el: Element, filter?: string): CharacterData[];
export declare function cookie(name: string, value?: string, attr?: {expires?: string; path?: string; domain?: string; secure?: boolean}): string;
export declare function crc32(data: number[]): number;
export declare function deCasteljau(points: Point[], position?: number): Point[];
export declare function debounce(fn: Function, limit?: number, asap?: boolean): Function;
export declare function deepest(el: Element): Node;
export declare function degToRad(value: number): number;
export declare function deindent(input: object | string, ...args: string[]): string;
export declare function distance(a: Point, b: Point): number;
export declare function drawHTML(context: CanvasRenderingContext2D, node: Node, x?: number, y?: number, w?: number, h?: number): HTMLImageElement;
export declare function drawPolygon(context: CanvasRenderingContext2D, points: Point[]): void;
export declare function drawTextArea(context: CanvasRenderingContext2D, text: string | any[], x?: number, y?: number, w?: number, h?: number, leading?: number, indent?: number): DrawTextResult;
export declare function escapeHTML(input: string): string;
export declare function escapeRegExp(input: string): string;
export declare function exec(command: string, argList: string[], input?: string, options?: ExecOptions): Promise<ExecResult>;
export declare function execChain(commands: CommandList, input?: string, options?: ExecOptions): Promise<ExecResult>;
export declare function execString(input: string): Promise<string>;
export declare function extractTableData(table: HTMLTableElement): object[];
export declare function findBasePath(paths: string[]): string;
export declare function formatBytes(bytes: number): string;
export declare function formatTime(input: number): string;
export declare function getCanvasFont(context: CanvasRenderingContext2D): FontStyle;
export declare function getProperties(subject: object): Map<any, any>;
export declare function getScrollbarWidth(): number;
export declare function getUnusedChar(input: string): string;
export declare function getWebGLSupport(): string;
export declare function hexToRGB(input: string | number): RGBColour;
export declare function hslToHSV(input: HSLColour): HSVColour;
export declare function hslToRGB(input: HSLColour): RGBColour;
export declare function hsvToHSL(input: HSVColour): HSLColour;
export declare function hsvToRGB(input: HSVColour): RGBColour;
export declare function injectWordBreaks(element: Element, limit?: number): HTMLElement[];
export declare function isFixedWidth(font: string): boolean;
export declare function isIE(version: string, operand: string): boolean;
export declare function isNativeDOM(): boolean;
export declare function isPrimitive(input: any): boolean;
export declare function isRegExp(input: any): boolean;
export declare function isString(input: any): boolean;
export declare function isValidCCNumber(input: string): boolean;
export declare function isplit(input: string, pattern: RegExp | string): string[];
export declare function kebabToCamelCase(input: string): string;
export declare function keyGrep(subject: object, pattern: RegExp | string): object;
export declare function ls(paths?: string[], options?: {filter?: RegExp | Function; ignore?: RegExp | Function; recurse?: number; followSymlinks?: boolean}): Promise<Map<string, fs.Stats>>;
export declare function nearest(subject: Node, selector: string, ignoreSelf?: boolean): Element;
export declare function nerf(fn: Function, context?: object): Function;
export declare function ordinalSuffix(n: number): string;
export declare function parseCSSDuration(value: string): number;
export declare function parseHTMLFragment(input: string): Node[];
export declare function parseKeywords(keywords: string | string[]): {[key: string]: boolean};
export declare function parseTime(input: string): number;
export declare function parseURL(path: string): ParsedURL;
export declare function partition(input: string | Iterable, sizes?: number | number[]): (string|Array)[];
export declare function poll(fn: Function, opts?: {rate?: number; timeout?: number; negate?: boolean}): Promise<void>;
export declare function punch(subject: object, methodName: string, handler: Function): Array<Function>;
export declare function radToDeg(value: number): number;
export declare function random(max: number, min?: number): number;
export declare function readStdin(encoding?: string): Promise<string>;
export declare function resolveProperty(object: object, path: string, usePrevious?: boolean): any;
export declare function rgbToCMY(input: RGBColour): CMYColour;
export declare function rgbToCMYK(input: RGBColour): CMYKColour;
export declare function rgbToHSL(input: RGBColour): HSLColour;
export declare function rgbToHSV(input: RGBColour): HSVColour;
export declare function rgbToHex(input: RGBColour, asString?: boolean): string;
export declare function rgba(r: number, g: number, b: number, a: number): number[];
export declare function rmrf(paths: string | string[], ignoreErrors?: boolean): Promise<void>;
export declare function rotl(value: number, count: number): number;
export declare function rotr(value: number, count: number): number;
export declare function sha1(input: number[]): string;
export declare function slug(name: string): string;
export declare function splitOptions(argv: Array<Array<string>>, niladicShort?: string, monadicShort?: string, monadicLong?: string): string[];
export declare function splitStrings(input: string, options?: {delimiters?: string; quoteChars?: string; escapeChars?: string; keepQuotes?: boolean; keepEscapes?: boolean}): string[];
export declare function supportsCSSProperty(name: string): boolean;
export declare function supportsCSSSelector(selector: string): boolean;
export declare function supportsCSSUnit(name: string): boolean;
export declare function tildify(input: string): string;
export declare function timeSince(time: number | Date, maxYear?: boolean): string;
export declare function titleCase(input: string): string;
export declare function tokeniseOutline(input: string): object[];
export declare function tween(subject: object, propertyName: string, endValue: number, options?: {curve?: Point[]; callback?: Function; filter?: Function; duration?: number; fps?: number}): Promise<any>;
export declare function uint(value: any): number;
export declare function uint16ToBytes(input: number | number[], littleEndian?: boolean): number[];
export declare function uint32ToBytes(input: number | number[], littleEndian?: boolean): number[];
export declare function uint64ToBytes(input: BigInt | BigInt[], littleEndian?: boolean): number[];
export declare function utf8Decode(input: string | number[]): number[];
export declare function utf8Encode(bytes: number[], opts?: {allowOverlong?: boolean; allowSurrogates?: boolean; codePoints?: boolean; strict?: boolean}): string;
export declare function vlqDecode(input: string): number[];
export declare function vlqEncode(input: number): string;
export declare function wait(delay?: number): Promise<void>;
export declare function which(name: string, all?: boolean): Promise<(string|Array<string>)>;
export declare function wordCount(input: string, ignoreHyphens?: boolean): number;
export declare function wordWrap(input: string, length?: number): string[];
export declare function wsDecodeFrame(input: number[], noMask?: boolean): WSFrame;
export declare function wsEncodeFrame(input: WSFrame, noMask?: boolean): Uint8Array;
export declare function wsHandshake(key: string): string;
