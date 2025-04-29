import {
  GeoJsonCodec,
  GeoJsonCodecConstructorOptions,
} from '@luciad/ria/model/codec/GeoJsonCodec';
import { Cursor } from '@luciad/ria/model/Cursor';
import { CodecDecodeOptions } from '@luciad/ria/model/codec/Codec';
import { ShapeType } from '@luciad/ria/shape/ShapeType';
import { Transformation } from '@luciad/ria/transformation/Transformation';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Point } from '@luciad/ria/shape/Point';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory';

const ref3D = getReference('EPSG:4978');

interface PanoFeatureProps {
  orientation: number;
}

export type PanoFeature = Feature<Point, PanoFeatureProps>;

export interface PanoCodecOptions extends GeoJsonCodecConstructorOptions {
  transformation?: Transformation;
}

export class PanoCodec extends GeoJsonCodec<PanoFeature> {
  private _transformation: Transformation | undefined;
  private txTo3D?: Transformation;

  constructor(options: PanoCodecOptions) {
    super(options);
    this._transformation = options.transformation;
  }

  set transformation(value: Transformation | undefined) {
    this._transformation = value;
  }

  get transformation(): Transformation | undefined {
    return this._transformation;
  }

  private getTransformationTo3D(
    sourceRef: CoordinateReference
  ): Transformation {
    if (!this.txTo3D) {
      this.txTo3D = createTransformation(sourceRef, ref3D);
    }
    return this.txTo3D;
  }

  override decode(options: CodecDecodeOptions): Cursor<PanoFeature> {
    const cursor = super.decode(options);

    return {
      hasNext: () => {
        return cursor.hasNext();
      },
      next: () => {
        const panoFeature = cursor.next();
        if (
          this._transformation &&
          panoFeature.shape?.type === ShapeType.POINT
        ) {
          panoFeature.shape = this._transformation.transform(panoFeature.shape);
        }

        const modelRef = panoFeature.shape.reference as CoordinateReference;
        if (!ref3D.equals(modelRef)) {
          const tx = this.getTransformationTo3D(modelRef);
          panoFeature.shape = tx.transform(panoFeature.shape);
        }
        return panoFeature;
      },
    };
  }
}
