import Slider from "rc-slider";
import React from "react";

interface Props {
   min: number;
   max: number;
   values: number[];
   step: number;
   onChange: (a:number[]) => void;
}

export const CustomRange : React.FC <Props> = (props: Props)=> {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MyHandle = (props: any) => {
        const { value, offset} = props;
        const handleStyle = { bottom: `${offset}%`};
        return(
            <div className="MySliderHandle" style={handleStyle} key={"rc-slider"+props.index} title={`Ellipsoidal Height:${value}`}>
                { props.dragging && <div className="bubble">{value}</div> }
            </div>
        )
    }

    const marks = {
        [props.min]: <div className="mark-point-cloud-scale">{`${props.min.toFixed(2)}`}</div>,
        [(props.max+props.min)*0.5]: <div className="mark-point-cloud-scale">{`Center`}</div>,
        [props.max]: <div className="mark-point-cloud-scale">{`${props.max.toFixed(2)}`}</div>,
    }

    return (
        <Slider.Range vertical={true} allowCross={false}
                      min={props.min}
                      max={props.max}
                      value={props.values}
                      step={0.01}
                      marks={marks}
                      handle={MyHandle}
                      onChange={props.onChange}/>
    )
}
