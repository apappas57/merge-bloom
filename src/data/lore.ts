/** Item lore — warm, cozy descriptions for the Collection book */
const ITEM_LORE: Record<string, string> = {
  // Flower chain
  flower_1: 'Every great garden starts with a single seedling and a little bit of hope.',
  flower_2: 'The sprout stretches toward the sun, dreaming of the flower it will become.',
  flower_3: 'They say a four-leaf clover brings luck, but all clovers bring a little joy.',
  flower_4: 'Tulips sway gently in the breeze, as if dancing to music only they can hear.',
  flower_5: 'The rose remembers every garden it has ever grown in.',
  flower_6: 'Cherry blossoms remind us that beautiful things are worth waiting for.',
  flower_7: 'The hibiscus blooms boldly, painting the garden in sunset colors.',
  flower_8: 'A bouquet is a love letter written in flowers.',

  // Butterfly chain
  butterfly_1: 'A tiny promise waiting to hatch.',
  butterfly_2: 'The caterpillar is already beautiful, even before it knows what it will become.',
  butterfly_3: 'The bee hums a little song as it works. It never forgets to enjoy the flowers.',
  butterfly_4: 'Ladybugs bring good luck wherever they land. This one chose your garden.',
  butterfly_5: 'The butterfly dances on the breeze, carrying whispered wishes between flowers.',
  butterfly_6: 'The peacock opens its feathers like a storybook of colors.',

  // Fruit chain
  fruit_1: 'A cluster of tiny suns, sweet and warm from the vine.',
  fruit_2: 'The apple fell far from the tree and found an even better garden.',
  fruit_3: 'Peel back the layers and you will find sunshine inside.',
  fruit_4: 'Small and fuzzy on the outside, bright and surprising within.',
  fruit_5: 'The mango carries the warmth of summer in every bite.',
  fruit_6: 'Soft as a sunset, sweet as a kind word.',
  fruit_7: 'The best gardens always end with cake.',

  // Crystal chain
  crystal_1: 'A single droplet holds a whole world of reflections.',
  crystal_2: 'Ice is just water wearing its winter coat.',
  crystal_3: 'What does the crystal ball see? A garden full of possibilities.',
  crystal_4: 'Formed from patience, pressure, and a little bit of magic.',
  crystal_5: 'Every gardener deserves a crown.',

  // Nature chain
  nature_1: 'One leaf falls. A hundred will follow. That is how forests begin.',
  nature_2: 'The maple leaf turns red to remind us that change can be beautiful.',
  nature_3: 'The pine tree stands tall through every season, steady and patient.',
  nature_4: 'A tree is just a seed that never gave up.',
  nature_5: 'The palm tree waves hello from somewhere warm and wonderful.',
  nature_6: 'A little cottage where the garden sleeps at night.',

  // Star chain
  star_1: 'The first star of the evening, making its quiet entrance.',
  star_2: 'This star shines a little brighter, as if it has something important to say.',
  star_3: 'Sparkles are just the universe saying hello.',
  star_4: 'Quick! Make a wish before it flies away.',
  star_5: 'The moon watches over the garden while it sleeps.',
  star_6: 'A rainbow is the sky\'s way of smiling after the rain.',

  // Tea chain
  tea_1: 'Every cup of tea begins with a humble leaf and a quiet moment.',
  tea_2: 'Matcha tastes like a garden feels: calm, green, and full of life.',
  tea_3: 'Coffee is a warm hug in a cup.',
  tea_4: 'Boba tea: because life needs a little sweetness and a lot of silliness.',
  tea_5: 'A cake slice is a tiny celebration waiting to happen.',
  tea_6: 'The tea set has seen a thousand conversations and remembers every one.',
  tea_7: 'A tea house is where stories brew as slowly as the tea.',

  // Shell chain
  shell_1: 'Coral grows so slowly that each piece is a tiny act of patience.',
  shell_2: 'Hold a shell to your ear and hear the ocean whispering secrets.',
  shell_3: 'The crab walks sideways because it likes to see where it has been.',
  shell_4: 'This fish carries a piece of the sunset on its scales.',
  shell_5: 'The dolphin leaps for joy because the ocean is always worth celebrating.',
  shell_6: 'The mermaid sings, and the whole garden listens.',

  // Sweet chain
  sweet_1: 'A candy is a tiny rainbow you can taste.',
  sweet_2: 'The lollipop spins slowly, as if showing off its colors.',
  sweet_3: 'Cookies are just hugs that taste like butter and sugar.',
  sweet_4: 'A cupcake is a cake that wants to be your best friend.',
  sweet_5: 'The donut goes around and around, never finding its missing piece.',
  sweet_6: 'Chocolate melts just to be closer to you.',
  sweet_7: 'A birthday cake with candles: because every day deserves a wish.',
  sweet_8: 'The Candy Castle stands at the top of the sweetest mountain in the world.',

  // Love Letters chain
  love_1: 'A love note, folded carefully and tucked inside a pocket close to the heart.',
  love_2: 'A growing heart beats a little faster when someone special is near.',
  love_3: 'A sparkling heart catches the light and refuses to let it go.',
  love_4: 'A gift heart, wrapped in ribbon, waiting to be given to someone who deserves it.',
  love_5: 'Twin hearts that beat in perfect rhythm, even from far away.',
  love_6: 'Eternal love is not loud. It is a quiet promise that never breaks.',

  // Cosmic Voyage chain
  cosmic_1: 'A space rock drifting silently, carrying the dust of a thousand stars.',
  cosmic_2: 'The comet streaks across the sky, leaving a trail of wishes behind.',
  cosmic_3: 'A UFO hums softly. Its passengers wave. They are just visiting.',
  cosmic_4: 'Earth, seen from far away, looks like a blue marble someone dropped in space.',
  cosmic_5: 'Saturn wears its rings like a crown, spinning slowly in the dark.',
  cosmic_6: 'A nebula is where stars are born. It smells like cotton candy. Probably.',
  cosmic_7: 'The rocket ship carries all our dreams. Next stop: everywhere.',

  // Cozy Cafe chain
  cafe_1: 'A single coffee bean holds the promise of an entire morning.',
  cafe_2: 'An espresso: small, strong, and full of opinions.',
  cafe_3: 'A croissant so flaky it leaves a trail of crumbs like breadcrumb directions home.',
  cafe_4: 'Waffles are just pancakes with abs.',
  cafe_5: 'A stack of pancakes tall enough to see the future from the top.',
  cafe_6: 'A layer cake with so many layers it has its own backstory.',
  cafe_7: 'A bakery where the door is always open and the oven is always warm.',
};

export function getLore(chainId: string, tier: number): string | undefined {
  return ITEM_LORE[`${chainId}_${tier}`];
}
