import external from '../externalModules.js';
import BaseTool from './base/BaseTool.js';
// Drawing
import { getNewContext, draw, setShadow } from '../drawing/index.js';
import toolStyle from '../stateManagement/toolStyle.js';
import toolColors from '../stateManagement/toolColors.js';
import { getLogger } from '../util/logger.js';
import drawArrow from './../drawing/drawArrow.js';
import drawTextBox from './../drawing/drawTextBox.js';

const logger = getLogger('tools:ScaleOverlayTool');

/**
 * @public
 * @class ScaleOverlayTool
 * @memberof Tools
 *
 * @classdesc Tool for displaying a scale overlay on the image.
 * @extends Tools.Base.BaseTool
 */
export default class ScaleOverlayTool extends BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'ScaleOverlay',
      configuration: {
        minorTickLength: 10,
        majorTickLength: 20,
      },
      mixins: ['enabledOrDisabledBinaryTool'],
    };

    super(props, defaultProps);
  }

  enabledCallback(element) {
    this.forceImageUpdate(element);
  }

  disabledCallback(element) {
    this.forceImageUpdate(element);
  }

  forceImageUpdate(element) {
    const enabledElement = external.cornerstone.getEnabledElement(element);

    if (enabledElement.image) {
      external.cornerstone.updateImage(element);
    }
  }

  renderToolData(evt) {
    const eventData = evt.detail;

    const context = getNewContext(eventData.canvasContext.canvas);
    const { image, viewport, element } = eventData;

    let rowPixelSpacing = image.rowPixelSpacing;
    let colPixelSpacing = image.columnPixelSpacing;
    const imagePlane = external.cornerstone.metaData.get(
      'imagePlaneModule',
      image.imageId
    );

    if (imagePlane) {
      rowPixelSpacing =
        imagePlane.rowPixelSpacing || imagePlane.rowImagePixelSpacing;
      colPixelSpacing =
        imagePlane.columnPixelSpacing || imagePlane.colImagePixelSpacing;
    }

    // Check whether pixel spacing is defined
    if (!rowPixelSpacing || !colPixelSpacing) {
      logger.warn(
        `unable to define rowPixelSpacing or colPixelSpacing from data on ${this.name}'s renderToolData`
      );

      return;
    }

    const canvasSize = {
      width: context.canvas.width,
      height: context.canvas.height,
    };

    // Distance between intervals is 1mm
    const verticalIntervalScale = (1.0 / rowPixelSpacing) * viewport.scale;
    const horizontalIntervalScale = (1.0 / colPixelSpacing) * viewport.scale;

    const vSize = (50.0 / rowPixelSpacing) * viewport.scale;
    const hSize = (50.0 / rowPixelSpacing) * viewport.scale;
    const hscaleBounds = {
      topLeft: {
        x: 15,
        y: canvasSize.height - 10,
      },
      bottomRight: {
        x: hSize + 15,
        y: canvasSize.height - 10,
      },
    };
    const vscaleBounds = {
      topLeft: {
        x: 15,
        y: canvasSize.height - 10,
      },
      bottomRight: {
        x: 15,
        y: canvasSize.height - 10 - vSize,
      },
    };

    if (
      !canvasSize.width ||
      !canvasSize.height ||
      !hscaleBounds ||
      !vscaleBounds
    ) {
      return;
    }

    const color = toolColors.getToolColor();
    const lineWidth = toolStyle.getToolWidth();

    const imageAttributes = Object.assign(
      {},
      {
        hscaleBounds,
        vscaleBounds,
        verticalMinorTick: verticalIntervalScale,
        horizontalMinorTick: horizontalIntervalScale,
        verticalLine: {
          start: {
            x: hscaleBounds.topLeft.x,
            y: hscaleBounds.bottomRight.y,
          },
          end: {
            x: vscaleBounds.bottomRight.x,
            y: vscaleBounds.bottomRight.y,
          },
        },
        horizontalLine: {
          start: {
            x: hscaleBounds.topLeft.x,
            y: hscaleBounds.bottomRight.y,
          },
          end: {
            x: hscaleBounds.bottomRight.x,
            y: hscaleBounds.bottomRight.y,
          },
        },
        color,
        lineWidth,
      },
      this.configuration
    );

    draw(context, context => {
      setShadow(context, imageAttributes);

      let lineDash;
      let optionsText;

      drawTextBox(
        context,
        '5 cm',
        imageAttributes.horizontalLine.end.x + 2,
        imageAttributes.horizontalLine.start.y - 10,
        color,
        optionsText
      );

      drawTextBox(
        context,
        '5 cm',
        0,
        imageAttributes.verticalLine.end.y - 20,
        color,
        optionsText
      );
      // Draw horizontal arrow
      drawArrow(
        context,
        imageAttributes.horizontalLine.start,
        imageAttributes.horizontalLine.end,
        color,
        lineWidth,
        lineDash
      );

      // Draw vertical arrow
      drawArrow(
        context,
        imageAttributes.verticalLine.start,
        imageAttributes.verticalLine.end,
        color,
        lineWidth,
        lineDash
      );
    });
  }
}
