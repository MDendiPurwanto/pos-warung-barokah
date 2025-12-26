import { RotateCw } from "lucide-react";
import { Button } from "./button/button";

interface RefreshButtonProps {
    onClick?: () => void;
}

export function RefreshButton({ onClick }: RefreshButtonProps) {
    const handleRefresh = () => {
        // Store fullscreen state to attempt restore after refresh
        if (document.fullscreenElement) {
            sessionStorage.setItem("was_fullscreen", "true");
        } else {
            sessionStorage.removeItem("was_fullscreen");
        }

        if (onClick) {
            onClick();
        } else {
            window.location.reload();
        }
    };

    return (
        <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            title="Segarkan Halaman"
        >
            <RotateCw style={{ width: 16, height: 16 }} />
            <span>Segarkan</span>
        </Button>
    );
}
