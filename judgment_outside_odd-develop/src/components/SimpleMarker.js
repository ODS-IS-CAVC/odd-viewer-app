import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { useEffect, useRef} from "react";

// マーカーの画像、サイズ、位置を設定（青いピン用）
const customMarker = (type) => {
    const icon = require(`../../public/${type}.png`)
    return L.icon({
        iconUrl: icon,
        iconSize: [30,45],
        className: 'marker',
        popupAnchor: [0, -43],
    })
}

// マーカーの画像、サイズ、位置を設定（青いピンのグレーアウト用）
const customMarkerGrey = (type) => {
    const icon = require(`../../public/${type}.png`)
    return L.icon({
        iconUrl: icon,
        iconSize: [43,54],
        className: 'marker',
        popupAnchor: [0, -43],
    })
}

// 青いピンを表示する関数
export const SimpleMarker = (props) => {

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
            icon={customMarker("Marker")} 
            ref={markerRef}
            >
            <Popup autoClose={props.streetParkingCar ? false : true}>{props.locationName}</Popup>
            </Marker>

        </>
    )
}

// 青いピン（グレーアウト）を表示する関数
export const GreyMarker = (props) => {

    // useRefの初期化
    const markerRef = useRef();

    // 初期表示時にポップアップを開く
    useEffect(() => {
        if(markerRef.current){
            markerRef.current.openPopup();
        }
    },[])

    return(
        <>
            <Marker 
            position={props.position}
            icon={customMarkerGrey("GreyMarker")} 
            ref={markerRef}
            >
            <Popup autoClose={false}>{props.locationName}</Popup>
            </Marker>
        </>
    )
}