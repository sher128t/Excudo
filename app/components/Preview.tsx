import { useWebContainer } from "~/context/WebContainerContext";

export function Preview() {
    const { serverUrl } = useWebContainer();

    return (
        <div className="flex-1 bg-white h-full flex flex-col">
            <div className="p-2 bg-gray-100 border-b border-gray-200 text-sm text-gray-600 truncate">
                {serverUrl || "Waiting for server..."}
            </div>
            {serverUrl ? (
                <iframe src={serverUrl} className="flex-1 w-full h-full border-none" />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    App preview will appear here
                </div>
            )}
        </div>
    );
}
