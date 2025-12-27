import { useState, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "./button/button";

interface FullscreenToggleProps {
    iconOnly?: boolean;
}

export function FullscreenToggle({ iconOnly }: FullscreenToggleProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        // Attempt to restore fullscreen if it was active before refresh
        const wasFullscreen = sessionStorage.getItem("was_fullscreen");
        if (wasFullscreen === "true" && !document.fullscreenElement) {
            sessionStorage.removeItem("was_fullscreen");
            // Some browsers allow this if it's within the same session/re-nav
            document.documentElement.requestFullscreen().catch(() => {
                console.log("Auto-fullscreen after refresh blocked by browser (security).");
            });
        }

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
            className="gap-2"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Fullscreen" : "Masuk Fullscreen"}
            aria-label="Toggle Fullscreen"
            size={iconOnly ? "icon" : "default"}
        >
            {isFullscreen ? <Minimize style={{ width: 18, height: 18 }} /> : <Maximize style={{ width: 18, height: 18 }} />}
            {!iconOnly && <span>{isFullscreen ? "Keluar" : "Layar Penuh"}</span>}
        </Button>
    );
}
