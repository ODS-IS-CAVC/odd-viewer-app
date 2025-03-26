import L from "leaflet";
import { Marker, Popup } from "react-leaflet"
import { useEffect, useRef } from "react"

// マーカーの画像、サイズ、位置を設定（信号機共通）
const customMarker = (type) => {
    const icon = require(`../../public/${type}.png`)
    return L.icon({
        iconUrl: icon,
        iconSize: [70,30],
        popupAnchor: [0, -13],
    })
}

// 信号機を表示する関数
export const TrafficLight = (props) => {

    // useRefの初期化
    const markerRef = useRef();
    
    // 路駐車有りの場合は初期表示時にポップアップを開く
    useEffect(() => {
        if(props.streetParkingCar && markerRef.current){
            markerRef.current.openPopup();
        }

    },[]);
    
    return(
        <>
            <Marker 
            position={props.position}
            icon={customMarker("TrafficLightMarker")} 
            ref={markerRef}
            >
            <Popup autoClose={props.streetParkingCar ? false : true}>{props.locationName}</Popup>
            </Marker>
        </>
    )
}

// 信号機（グレーアウト）を表示する関数
export const GreyTrafficLight = (props) => {

    // useRefの初期化
    const markerRef = useRef();
    
    // 路駐車有りの場合は初期表示時にポップアップを開く
    useEffect(() => {
        if(markerRef.current){
            markerRef.current.openPopup();
        }
    },[]);

    return(
        <>
            <Marker 
            position={props.position}
            icon={customMarker("GreyTrafficLightMarker")} 
            ref={markerRef}
            >
            <Popup autoClose={false}>{props.locationName}</Popup>
            </Marker>
        </>
    )
}