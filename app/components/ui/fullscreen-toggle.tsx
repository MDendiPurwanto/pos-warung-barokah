import { useState, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "./button/button";

export function FullscreenToggle() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Fullscreen" : "Masuk Fullscreen"}
            aria-label="Toggle Fullscreen"
        >
            {isFullscreen ? <Minimize style={{ width: 20, height: 20 }} /> : <Maximize style={{ width: 20, height: 20 }} />}
        </Button>
    );
}
