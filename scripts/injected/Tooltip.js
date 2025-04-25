import { TooltipSize } from "./TooltipSize.js";

class Tooltip extends TooltipSize {
    constructor(event, blobData, tooltipSizeSetting) {
        super(blobData, tooltipSizeSetting);
        this.setShape(event);
        if (!this.shape || !this.tooltipSize) {
            return;
        }
        if (this.blobData !== null) {
            this.correctTooltipSize();
        }
        this.createTooltip();
    }

    getTooltip() {
        return this.tooltipGroup;
    }

    setShape(event) {
        if (!event || !event.target || !event.target.parent) {
            return;
        }
        this.shape = {
            target: event.target,
            box: event.target.parent,
            label: event.target.parent._clazzId,
            x: event.target.parent.children[1].attrs.x,
            y: event.target.parent.children[1].attrs.y,
            width: event.target.parent.width(),
            height: event.target.parent.height(),
        };
        if (typeof event.target.parent.attrs.x === "number") {
            this.shape.x += event.target.parent.attrs.x;
        }
        if (typeof event.target.parent.attrs.y === "number") {
            this.shape.y += event.target.parent.attrs.y;
        }
    }

    getShapeGrammage() {
        const parts = this.shape.label.split("_");
        const regex = new RegExp(/^\d*(?:x\d+)?(?:g|ml|kg|L|sasz|kap|szt|tab)$/);
        for (let i = 0; i < parts.length; ++i) {
            if (regex.test(parts[i])) {
                return parts[i];
            }
        }
        return null;
    }

    setTooltipPosition() {
        if (this.shape.x + this.shape.width + this.tooltipSize.width > this.getLimiter().x) {
            const leftSideTooltipPosition = this.shape.x - this.tooltipSize.width - 20;
            const leftSideLimit = leftSideTooltipPosition + (this.tooltipSize.width * 0.8);
            if (this.getStagePosition().x < leftSideLimit) { // keep tooltip on the right side of BB if it wouldn't be visible in at least about 20%
                this.tooltipGroup.x(leftSideTooltipPosition); // tooltip on left of BB
            }
        }
        if (this.shape.y + this.tooltipSize.height + 20 > this.getLimiter().y) {
            const topTooltipPositionWithBlob = this.shape.y - this.tooltipSize.height - 10;
            const topTooltipPostitionWithoutBlob = this.shape.y - this.tooltipSize.height - 40;
            const topLimit = topTooltipPositionWithBlob + (this.tooltipSize.height * 0.5);
            if (this.getStagePosition().y < topLimit) { // keep tooltip on bootom if it wouldn't be visible in at least about 50%
                if (this.blobData === null) {
                    this.tooltipGroup.y(topTooltipPostitionWithoutBlob); // tooltip on top of BB above label
                } else {
                    this.tooltipGroup.y(topTooltipPositionWithBlob); // tooltip on top of BB
                }
            }
        } 
        else if (this.getStagePosition().y > (this.shape.y - 30)) {
            const bottomTooltipPosition = this.shape.y + this.shape.height + 20;
            const tooltipPositionOnTheMiddleOfShape = this.shape.y + (this.shape.height / 2) - (this.tooltipSize.height / 2);
            if (this.getStagePosition().y < tooltipPositionOnTheMiddleOfShape) {
                this.tooltipGroup.y(tooltipPositionOnTheMiddleOfShape); // tooltip on the middle of shape
            } else {
                this.tooltipGroup.y(bottomTooltipPosition); // tooltip on bootom of BB
            }
        }
    }

    createTooltip() {
        this.tooltipGroup = new window.Konva.Group({ 
            name: 'tooltipGroup',
            x: this.shape.x + this.shape.width + 20,
            y: this.shape.y,
        });
        const tooltipBackground = new window.Konva.Rect({
            fill: this.blobData !== null ? `${this.blobData.color}8c` : "#FFFFFFBF", // 8c = 55% opacity
            width: this.tooltipSize.width,
            height: this.tooltipSize.height,
            cornerRadius: 5,
        });
        this.tooltipGroup.add(tooltipBackground);
        if (this.blobData !== null) {
            const tooltipImage = new window.Konva.Image({
                width: this.tooltipSize.width - 20,
                height: this.tooltipSize.height - 20,
                x: 10,
                y: 10,
            });
            const imageObj = new Image();
            imageObj.src = this.blobData.blob;
            imageObj.onload = () => {
                tooltipImage.image(imageObj);
            };
            this.tooltipGroup.add(tooltipImage);
        }
    }

    createTooltipText(attributes, showGrammage) {
        const labelText = this.getTextContents(attributes, showGrammage);

        const textElements = labelText.map((line) => new window.Konva.Text({
            text: line,
            fontSize: this.getTextFontSize(),
            fontStyle: "bold",
            fontFamily: "Arial",
            fill: "black",
            align: "center",
            padding: 5,
        }));
        if (!textElements[0]) { 
            return;
        }
        const [textElementsHeight, textElementsMaxWidth, maxWidthDiff] = this.adjustTooltipText(textElements);
        if (this.blobData !== null) {
            const tooltipTextBackground = new window.Konva.Rect({
                fill: "rgba(255, 255, 255, 0.75)", 
                width: textElementsMaxWidth,
                height: textElementsHeight, 
                cornerRadius: 5,
                y: this.tooltipSize.height,
                x: textElementsMaxWidth > this.tooltipSize.width ? 0 - (maxWidthDiff / 2) : 0
            });
            this.tooltipGroup.add(tooltipTextBackground);
        }
        else {
            this.tooltipGroup.children[0].width(this.tooltipSize.width);
            this.tooltipGroup.children[0].height(textElementsHeight);
            this.tooltipSize.height = textElementsHeight; // update tooltip size for positioning
            textElements.forEach((text) => {
                text.width(this.tooltipSize.width);
            });
        }
        textElements.forEach((text) => {
            this.tooltipGroup.add(text);
        });
    }

    getTextContents(attributes, showGrammage) {
        const labelText = [];
        if (showGrammage === true && this.getShapeGrammage() !== null) {
            labelText.push(this.getShapeGrammage());
        }
        if (this.blobData !== null && this.blobData.moreBlobs === true) {
            labelText.push("Więcej niż 1 wzorzec!");
        }
        if (!attributes) {
            return labelText;
        }
        for (const key of Object.keys(attributes)) {
            let values = attributes[key].values;
            if (!values || !values[0]) {
                continue;
            }
            for (let i = 0; i < values.length; ++i) {
                if (values[i] === "false") {
                    values.splice(i, 1);
                }
            }
            if (values.length > 1) {
                values = values.join(", ");
            }
            if (values.length >= 1) {
                labelText.push(`${attributes[key].attributeType.name}: ${values}`);
            }
        }
        return labelText;
    }

    adjustTooltipText(konvaTextArr) {
        let textElementsHeight = 0;
        let textElementsMaxWidth = this.tooltipSize.width;
        let maxWidthDiff = 0;
        for (let i = 0; i < konvaTextArr.length; ++i) {
            konvaTextArr[i].y(
                this.tooltipSize.height + (i * konvaTextArr[i].height())
            );
            textElementsHeight += konvaTextArr[i].height();
            // when no blob data is present, adjust tooltip size to the text size
            if (this.blobData === null) {
                if (konvaTextArr[i].width() > this.tooltipSize.width) {
                    this.tooltipSize.width = konvaTextArr[i].width() + 10;
                }
                continue;
            }
            // adjusting text dimensions according to the tooltip size
            if (konvaTextArr[i].width() < this.tooltipSize.width) {
                konvaTextArr[i].width(this.tooltipSize.width);
            }
            if (textElementsMaxWidth < konvaTextArr[i].width()) {
                maxWidthDiff = (konvaTextArr[i].width() - this.tooltipSize.width) + 10;
                textElementsMaxWidth = konvaTextArr[i].width() + 10;
                konvaTextArr[i].x(
                    0 - (maxWidthDiff / 2)
                );
            } 
            else if (konvaTextArr[i].width() > this.tooltipSize.width) {
                let thisWidthDiff = konvaTextArr[i].width() - this.tooltipSize.width;
                konvaTextArr[i].x(
                    0 - (thisWidthDiff / 2)
                );
            }
        }
        return [textElementsHeight, textElementsMaxWidth, maxWidthDiff];
    }
}

export { Tooltip };