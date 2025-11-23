import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"

function StackedCircularFooter() {
    return (
        <footer className="bg-gradient-to-b from-amber-50/50 to-orange-50/80 py-12 border-t-2 border-amber-200">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center">
                    <div className="mb-6 rounded-full bg-amber-100/60 p-6 border-2 border-amber-200">
                        <Icons.logo className="icon-class w-6 text-amber-600" />
                    </div>
                    <div className="mb-6 flex gap-4 items-center">
                        <Button variant="outline" size="sm" className="rounded-full border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-colors" asChild>
                            <a href="https://github.com/wawahejun/Walrus_Event" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <Icons.gitHub className="h-4 w-4 text-amber-700" />
                                <span className="text-amber-700 font-medium">Project Repository</span>
                            </a>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-colors" asChild>
                            <a href="https://github.com/wawahejun" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <Icons.gitHub className="h-4 w-4 text-amber-700" />
                                <span className="text-amber-700 font-medium">Contact Developer</span>
                            </a>
                        </Button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            © 2025 Walrus Event. All rights reserved.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Use the navigation bar to explore different features
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export { StackedCircularFooter }
