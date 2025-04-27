import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../ui/carousel";

const CharacterCarousel = ({ setApi }: { setApi: () => void }) => {
    return (
        <div className="grid place-items-center gap-3">
            <Carousel setApi={setApi} opts={{ loop: true }} className="w-[60%]">
                <CarouselContent>
                    <CarouselItem>
                        <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Nancy_idle_anim_20.png"
                                alt="Nancy"
                                width={50}
                                height={50}
                            />
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                        <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Ash_idle_anim_20.png"
                                alt="Ash"
                                width={50}
                                height={50}
                            />
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                        <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Lucy_idle_anim_20.png"
                                alt="Lucy"
                                width={50}
                                height={50}
                            />
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                        <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Adam_idle_anim_20.png"
                                alt="Adam"
                                width={50}
                                height={50}
                            />
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="cursor-pointer" />
                <CarouselNext className="cursor-pointer" />
            </Carousel>
        </div>
    );
};

export default CharacterCarousel;
