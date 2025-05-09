import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "../components/ui/tooltip";
import GitHubLogo from "../components/icons/GitHubLogo";
import XLogo from "../components/icons/XLogo";
import { Check, InfoIcon } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";

const CornerActionButtons = ({ isInGame }: { isInGame: boolean }) => {
    const isInGameCss = "bg-white text-white-foreground hover:bg-white/90";
    const isInLobbyCss =
        "bg-primary text-primary-foreground hover:bg-primary/90";
    const buttonCss = `shadow-xs p-2 rounded-full cursor-pointer ${
        isInGame ? isInGameCss : isInLobbyCss
    }`;

    return (
        <div
            className={`absolute bottom-7 flex items-center gap-3 ${
                isInGame ? "left-12" : "right-12"
            }`}
        >
            {/* Info */}
            <Popover>
                <Tooltip>
                    <PopoverTrigger>
                        <TooltipTrigger asChild>
                            <div className={buttonCss}>
                                <InfoIcon />
                            </div>
                        </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent
                        className={!isInGame ? "bg-primary" : "text-primary"}
                        customTooltipArrow={
                            !isInGame ? "bg-primary fill-primary" : undefined
                        }
                    >
                        Project information
                    </TooltipContent>
                    <PopoverContent className="z-[100] w-fit ml-5 mb-3">
                        <ProjectInformation />
                    </PopoverContent>
                </Tooltip>
            </Popover>

            {/* GitHub */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href="https://www.github.com/Zopsss/CaveVerse"
                        target="_blank"
                        className={buttonCss}
                    >
                        <GitHubLogo
                            fill={`${isInGame ? "#000000" : "#ffffff"}`}
                        />
                    </a>
                </TooltipTrigger>
                <TooltipContent
                    className={!isInGame ? "bg-primary" : "text-primary"}
                    customTooltipArrow={
                        !isInGame ? "bg-primary fill-primary" : undefined
                    }
                >
                    Github repository
                </TooltipContent>
            </Tooltip>

            {/* X */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href="https://www.x.com/zopssukiii"
                        target="_blank"
                        className={buttonCss}
                    >
                        <XLogo fill={`${isInGame ? "#000000" : "#ffffff"}`} />
                    </a>
                </TooltipTrigger>
                <TooltipContent
                    className={!isInGame ? "bg-primary" : "text-primary"}
                    customTooltipArrow={
                        !isInGame ? "bg-primary fill-primary" : undefined
                    }
                >
                    X / Twitter
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

const ProjectInformation = () => (
    <>
        <h2 className="text-xl font-bold mb-4">Project Information</h2>
        <ul className="space-y-3 flex items-start flex-col">
            <li className="flex items-start justify-center gap-2">
                <Check size={22} />
                <div>
                    <h3 className="font-xl font-bold mb-1">
                        Public/Custom Rooms
                    </h3>
                    <p className="text-sm">
                        Join public rooms or create private ones, with or
                        without a password.
                    </p>
                </div>
            </li>
            <li className="flex items-start justify-center gap-2">
                <Check size={22} />
                <div>
                    <h3 className="font-xl font-bold mb-1">
                        Character Controlling
                    </h3>
                    <p className="text-sm">
                        Move your character using the arrow keys.
                    </p>
                </div>
            </li>
            <li className="flex items-start justify-center gap-2">
                <Check size={22} />
                <div>
                    <h3 className="font-xl font-bold mb-1">Proximity Chat</h3>
                    <p className="text-sm">
                        When outside offices, you can video call nearby players
                        via proximity chat. This gets disabled upon entering any
                        office.
                    </p>
                </div>
            </li>
            <li className="flex items-start justify-center gap-2">
                <Check size={22} />
                <div>
                    <h3 className="font-xl font-bold mb-1">Offices</h3>
                    <p className="text-sm">
                        Private spaces on the map where:
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>All members can video call each other</li>
                            <li>Each office has its own private chat</li>
                            <li>Screen sharing is supported</li>
                            <li>Proximity chat is disabled</li>
                        </ul>
                    </p>
                </div>
            </li>
        </ul>
    </>
);

export default CornerActionButtons;
