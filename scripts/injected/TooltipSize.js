import { KonvaMaths } from "./KonvaMaths.js";

class TooltipSize extends KonvaMaths {
    constructor(blobData, tooltipSizeSetting) {
        super();
        if (!blobData || this.isTooltipSizeSettingValid(tooltipSizeSetting) === false) {
            return;
        }
        this.blobData = blobData;
        this.tooltipSizeSetting = tooltipSizeSetting; 
        this.isLargeBlob = (this.blobData.width + this.blobData.height) > 1500;
        this.tooltipSize = {
            width: this.getBaseTooltipSize("width"),
            height: this.getBaseTooltipSize("height"),
        };
    }

    isTooltipSizeSettingValid(settingVal) {
        if (settingVal === "small" || settingVal === "medium" || settingVal === "big") {
            return true;
        }
        return false;
    }

    getMinimumSizeAccToSettings() {
        switch(this.tooltipSizeSetting) {
            case "small":
                return 160;
            case "big":
                return 210;
            default:
                return 180;
        }
    }

    getScalingBaseAccToSettings() {
        switch(this.tooltipSizeSetting) {
            case "small":
                return 0.8;
            case "big":
                return 0.55;
            default:
                return 0.65;
        }
    }

    getBaseTooltipSize(dimension) {
        const axis = dimension === "width" ? "x" : "y";

        const scale = Number(this.getScale()[axis]) < 0.5 ? Number(this.getScale()[axis]) + 0.15 : Number(this.getScale()[axis]);
        const base = this.isLargeBlob ? this.getScalingBaseAccToSettings() + 0.9 : this.getScalingBaseAccToSettings();

        return this.blobData[dimension] / (base + scale);
    }

    calculateImageToStageRatio() {
        return (this.blobData.width + this.blobData.height) / (this.getStageSize().width + this.getStageSize().height);
    }

    scaleTooltipSize(ratio) {
        const base = this.getScalingBaseAccToSettings();
        this.tooltipSize.width /= (base + ratio);
        this.tooltipSize.height /= (base + ratio);
    }

    isTooltipTooLarge() {
        return (
            this.tooltipSize.width / this.getStageSize().width > 0.4 ||
            this.tooltipSize.height / this.getStageSize().height > 0.4
        );
    }

    reduceTooltipSize() {
        this.tooltipSize.width /= (0.8 + this.getScalingBaseAccToSettings());
        this.tooltipSize.height /= (0.8 + this.getScalingBaseAccToSettings());
    }

    /** @returns {[boolean,boolean]} [0] - does need adjustment?, [1] - is narrow? */
    needsMinimumSizeAdjustment() {
        let minimumSize = this.getMinimumSizeAccToSettings();
        const imageWidthToHeightRatio = this.blobData.width / this.blobData.height;
        const imageHeightToWidthRatio = this.blobData.height / this.blobData.width;
        const isNarrow = (imageWidthToHeightRatio < 0.5 || imageHeightToWidthRatio < 0.5);
        if (isNarrow === true) {
            minimumSize -= 80;
        }
        if ((this.tooltipSize.width < minimumSize || this.tooltipSize.height < minimumSize)) {
            return [true, isNarrow];
        } else {
            return [false, isNarrow];
        }
    }

    adjustToMinimumSize() {
        let minimumSize = this.getMinimumSizeAccToSettings();
        if (this.needsMinimumSizeAdjustment()[1] === true) {
            minimumSize -= 80;
        }
        const widthDiff = minimumSize - this.tooltipSize.width;
        const heightDiff = minimumSize - this.tooltipSize.height;
        const widthDiffRatio = widthDiff / this.tooltipSize.width;
        const heightDiffRatio = heightDiff / this.tooltipSize.height;

        if (widthDiffRatio > heightDiffRatio) {
            this.tooltipSize.width = minimumSize;
            this.tooltipSize.height += this.tooltipSize.height * widthDiffRatio;
        } else {
            this.tooltipSize.width += this.tooltipSize.width * heightDiffRatio;
            this.tooltipSize.height = minimumSize;
        }
    }

    correctTooltipSize() {
        const imageToStageSizeRatio = this.calculateImageToStageRatio();

        this.scaleTooltipSize(imageToStageSizeRatio);

        if (this.isTooltipTooLarge() === true) {
            this.reduceTooltipSize();
        }

        if (this.needsMinimumSizeAdjustment()[0] === true) {
            this.adjustToMinimumSize();
        }
    }

    getTextFontSize() {
        if (this.getScale().x > 2.5) {
            return 8;
        }
        else if (this.getScale().x > 1) {
            return Math.round(20 / this.getScale().x);
        }
        else if (this.getScale().x <= 1 && this.getScale().x > 0.8) {
            return 18;
        }
        else if (this.getScale().x < 0.8 && this.getScale().x > 0.4) {
            return Math.round(15 / this.getScale().x);
        }
        else {
            return 35;
        }
    }
}

export { TooltipSize }