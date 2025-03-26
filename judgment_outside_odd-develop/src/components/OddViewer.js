import React, { useState } from "react";
import { Map } from './Map';
import App from '../App';
import { WeatherInformation } from "./WeatherInformation";

export  const OddViewer = ({accessToken}) => {

    // 地図画面の表示切替に使用（trueのときは表示）
    const [mapDisplay, setMapDisplay] = useState(true);

    // 401エラー時に画面切り替えに使用する関数
    const mapDisplayChange = (value) => {
        setMapDisplay(value);
    }

    return(
        <>
        <div className={mapDisplay ? "screenall flex" : "none"}>

            {/* 地図画面と警告文表示領域 */}
            <Map 
            accessToken={accessToken} 
            mapDisplayChange={mapDisplayChange}
            tempMapDisplay={mapDisplay}
            />
            
            {/* 気象情報表示領域 */}
            <div className={mapDisplay ? "weatherView overflow": "none"}>
                <WeatherInformation 
                accessToken={accessToken}
                mapDisplayChange={mapDisplayChange}
                tempMapDisplay={mapDisplay}
                />
            </div>

        </div>

        {/* 地図画面の描画で401エラーが発生した際に表示するログイン画面 */}
        <div className={mapDisplay? "none" : "screenall"}>
            <App />
        </div>    
        </>
    )
}