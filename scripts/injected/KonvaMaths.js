class KonvaMaths {
    getLatestStage() {
        const latestStageId = window.Konva.stages.length - 1;
        return window.Konva.stages[latestStageId];
    }

    getStageAttrs() {
        return this.getLatestStage().attrs;
    }

    getScale() {
        return { x: this.getStageAttrs().scaleX, y: this.getStageAttrs().scaleY };
    }

    getStagePosition() {
        const scale = this.getScale();
        return { x: 0 - this.getStageAttrs().x / scale.x, y: 0 - this.getStageAttrs().y / scale.y};
    }

    getStageSize() {
        const scale = this.getScale();
        return { width: this.getStageAttrs().width / scale.x, height: this.getStageAttrs().height / scale.y };
    }

    getImageSize() {
        const imageGroup = this.getLatestStage().findOne("#image");
        const imageWidth = imageGroup.attrs.width;
        const imageHeight = imageGroup.attrs.height;
        return { width: imageWidth, height: imageHeight };
    }

    getBBLimiter() {
        const img = this.getImageSize();
        return { x: img.width, y: img.height };
    }

    getLimiter() {
        const stagePosition = this.getStagePosition();
        const stageSize = this.getStageSize();
        return { x: stagePosition.x + stageSize.width, y: stagePosition.y + stageSize.height };
    }

    getStageAbsolutePosition() {
        return { x: this.getStageAttrs().x, y: this.getStageAttrs().y};
    }

    getMinimumScale() {
        const canvas = document.querySelector("canvas");
        const canvasSize = { height: canvas.clientHeight, width: canvas.clientWidth };
        const imgSize = this.getImageSize();
        const limits = { width: imgSize.width + 250, height: imgSize.height + 250 };
        const minimumScaleX = canvasSize.width / limits.width;
        const minimumScaleY = canvasSize.height / limits.height;
        if (minimumScaleX < minimumScaleY) {
            return minimumScaleX;
        }
        return minimumScaleY;
    }

    getToolbarsSizes() {
        const topToolbarHeight = document.querySelector("mat-toolbar").offsetHeight;
        const leftToolbarWidth = document.querySelector("div.tool-nav.mat-accent").offsetWidth;
        return { x: leftToolbarWidth, y: topToolbarHeight };
    }

    getMouseOnStagePosition(pos={}) {
        let {offsetX, offsetY} = pos;
        offsetX /= this.getScale().x;
        offsetY /= this.getScale().y;
        offsetX += this.getStagePosition().x;
        offsetY += this.getStagePosition().y;
        if (offsetX < 0) {
            offsetX = 0;
        }
        else if (offsetX > this.getBBLimiter().x) {
            offsetX = this.getBBLimiter().x;
        }
        if (offsetY < 0) {
            offsetY = 0;
        }
        else if (offsetY > this.getBBLimiter().y) {
            offsetY = this.getBBLimiter().y;
        }
        return { x: Math.round(offsetX), y: Math.round(offsetY) };
    }

    getConvertedMousePositionFromAnnotationPoints(points={}) {
        let {x, y} = points;
        x -= this.getStagePosition().x;
        y -= this.getStagePosition().y;
        x *= this.getScale().x;
        y *= this.getScale().y;
        const toolbarsSizes = this.getToolbarsSizes();
        x += toolbarsSizes.x + 5; // 5 for margin
        y += toolbarsSizes.y + 5; // 5 for margin
        return { x: Math.round(x), y: Math.round(y) };
    } 
}

export { KonvaMaths };