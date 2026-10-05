#!/usr/bin/env python3
"""
LES ICONES D'ITEMS DE LA PAGE D'UN MATCH (05/10/2026).

Source : les textures du client Minecraft 1.8.9 (assets/minecraft/textures/items et
blocks, extraites du jar officiel de Mojang). On ne copie dans public/items que les
images utiles, et on ecrit src/lib/items-sprites.ts : nom de Material Bukkit
(+ valeur de donnee pour la laine, la teinture, le bois) -> fichier.

Usage : python3 outils/generer-items.py <dossier textures>
"""
import json, os, shutil, sys

SRC = sys.argv[1]
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(SITE, 'public', 'items')

COULEURS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray',
            'silver', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black']
BOIS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'big_oak']

# Material -> texture ("items/x" ou "blocks/x") quand le nom ne suffit pas.
EXCEPTIONS = {
    'MUSHROOM_SOUP': 'items/mushroom_stew', 'FISHING_ROD': 'items/fishing_rod_uncast', 'BOW': 'items/bow_standby',
    'LAVA_BUCKET': 'items/bucket_lava', 'WATER_BUCKET': 'items/bucket_water', 'BUCKET': 'items/bucket_empty',
    'MILK_BUCKET': 'items/bucket_milk', 'GOLDEN_APPLE': 'items/apple_golden', 'COOKED_BEEF': 'items/beef_cooked',
    'RAW_BEEF': 'items/beef_raw', 'GOLDEN_CARROT': 'items/carrot_golden', 'CARROT_ITEM': 'items/carrot',
    'POTATO_ITEM': 'items/potato', 'BAKED_POTATO': 'items/potato_baked', 'COOKED_CHICKEN': 'items/chicken_cooked',
    'RAW_CHICKEN': 'items/chicken_raw', 'GRILLED_PORK': 'items/porkchop_cooked', 'PORK': 'items/porkchop_raw',
    'COOKED_FISH': 'items/fish_cod_cooked', 'RAW_FISH': 'items/fish_cod_raw', 'EXP_BOTTLE': 'items/experience_bottle',
    'SNOW_BALL': 'items/snowball', 'POTION': 'items/potion_bottle_drinkable', 'GLASS_BOTTLE': 'items/potion_bottle_empty',
    'WOOD_SWORD': 'items/wood_sword', 'WOOD_AXE': 'items/wood_axe', 'WOOD_PICKAXE': 'items/wood_pickaxe',
    'WOOD_SPADE': 'items/wood_shovel', 'STONE_SPADE': 'items/stone_shovel', 'IRON_SPADE': 'items/iron_shovel',
    'GOLD_SPADE': 'items/gold_shovel', 'DIAMOND_SPADE': 'items/diamond_shovel', 'GOLD_SWORD': 'items/gold_sword',
    'GOLD_AXE': 'items/gold_axe', 'GOLD_PICKAXE': 'items/gold_pickaxe', 'SULPHUR': 'items/gunpowder',
    'BED': 'items/bed', 'SKULL_ITEM': 'items/skull_steve', 'BOOK_AND_QUILL': 'items/book_writable',
    'SPECKLED_MELON': 'items/melon_speckled', 'MELON': 'items/melon', 'SEEDS': 'items/seeds_wheat',
    'COBBLESTONE': 'blocks/cobblestone', 'COBBLE_WALL': 'blocks/cobblestone', 'MOSSY_COBBLESTONE': 'blocks/cobblestone_mossy',
    'SANDSTONE': 'blocks/sandstone_normal', 'RED_SANDSTONE': 'blocks/red_sandstone_normal', 'RED_MUSHROOM': 'blocks/mushroom_red',
    'BROWN_MUSHROOM': 'blocks/mushroom_brown', 'ENDER_STONE': 'blocks/end_stone', 'GRASS': 'blocks/grass_side',
    'LOG': 'blocks/log_oak', 'LOG_2': 'blocks/log_acacia', 'LEAVES': 'blocks/leaves_oak', 'LEAVES_2': 'blocks/leaves_acacia',
    'TNT': 'blocks/tnt_side', 'WORKBENCH': 'blocks/crafting_table_front', 'FURNACE': 'blocks/furnace_front_off',
    'SNOW_BLOCK': 'blocks/snow', 'SMOOTH_BRICK': 'blocks/stonebrick', 'HARD_CLAY': 'blocks/hardened_clay',
    'QUARTZ_BLOCK': 'blocks/quartz_block_side', 'PRISMARINE': 'blocks/prismarine_rough', 'PACKED_ICE': 'blocks/ice_packed',
    'TORCH': 'blocks/torch_on', 'YELLOW_FLOWER': 'blocks/flower_dandelion', 'RED_ROSE': 'blocks/flower_rose',
    'LONG_GRASS': 'blocks/tallgrass', 'DEAD_BUSH': 'blocks/deadbush', 'SAPLING': 'blocks/sapling_oak',
    'HAY_BLOCK': 'blocks/hay_block_side', 'MELON_BLOCK': 'blocks/melon_side', 'PUMPKIN': 'blocks/pumpkin_side',
    'CACTUS': 'blocks/cactus_side', 'WEB': 'blocks/web', 'LADDER': 'blocks/ladder', 'VINE': 'blocks/vine',
    'BRICK': 'blocks/brick', 'NETHER_BRICK': 'blocks/nether_brick', 'SOUL_SAND': 'blocks/soul_sand',
    'MYCEL': 'blocks/mycelium_side', 'STEP': 'blocks/stone_slab_side', 'WOOD_STEP': 'blocks/planks_oak',
    'DRAGON_EGG': 'blocks/dragon_egg', 'DIAMOND_ORE': 'blocks/diamond_ore', 'NOTE_BLOCK': 'blocks/noteblock',
    'JUKEBOX': 'blocks/jukebox_side', 'BOOKSHELF': 'blocks/bookshelf', 'ANVIL': 'blocks/anvil_base',
    'ENCHANTMENT_TABLE': 'blocks/enchanting_table_side', 'IRON_FENCE': 'blocks/iron_bars', 'THIN_GLASS': 'blocks/glass',
    'FENCE': 'blocks/planks_oak', 'WOOD_STAIRS': 'blocks/planks_oak', 'COBBLESTONE_STAIRS': 'blocks/cobblestone',
    'SPONGE': 'blocks/sponge', 'SEA_LANTERN': 'blocks/sea_lantern', 'SLIME_BLOCK': 'blocks/slime',
}
# Material -> gabarit selon la valeur de donnee (0..15).
PAR_DONNEE = {
    'WOOL': lambda d: f'blocks/wool_colored_{COULEURS[d]}',
    'STAINED_CLAY': lambda d: f'blocks/hardened_clay_stained_{COULEURS[d]}',
    'STAINED_GLASS': lambda d: f'blocks/glass_{COULEURS[d]}',
    'STAINED_GLASS_PANE': lambda d: f'blocks/glass_{COULEURS[d]}',
    'INK_SACK': lambda d: f'items/dye_powder_{COULEURS[15 - d]}',
    'WOOD': lambda d: f'blocks/planks_{BOIS[d]}' if d < 6 else None,
}
# Les autres : le nom en minuscules, s'il existe tel quel.
SIMPLES = """DIAMOND_SWORD IRON_SWORD STONE_SWORD DIAMOND_AXE IRON_AXE STONE_AXE DIAMOND_PICKAXE IRON_PICKAXE
STONE_PICKAXE DIAMOND_HELMET DIAMOND_CHESTPLATE DIAMOND_LEGGINGS DIAMOND_BOOTS IRON_HELMET IRON_CHESTPLATE
IRON_LEGGINGS IRON_BOOTS GOLD_HELMET GOLD_CHESTPLATE GOLD_LEGGINGS GOLD_BOOTS CHAINMAIL_HELMET CHAINMAIL_CHESTPLATE
CHAINMAIL_LEGGINGS CHAINMAIL_BOOTS LEATHER_HELMET LEATHER_CHESTPLATE LEATHER_LEGGINGS LEATHER_BOOTS BOWL ARROW
FLINT_AND_STEEL ENDER_PEARL COMPASS IRON_INGOT GOLD_INGOT DIAMOND STICK STRING FEATHER FLINT APPLE BREAD
COOKIE EGG SADDLE SHEARS BONE SUGAR PAPER BOOK CLAY_BALL EMERALD COAL REDSTONE GOLD_NUGGET BLAZE_ROD
STONE DIRT SAND GRAVEL OBSIDIAN GLASS ICE NETHERRACK GLOWSTONE IRON_BLOCK GOLD_BLOCK DIAMOND_BLOCK
EMERALD_BLOCK COAL_BLOCK REDSTONE_BLOCK LAPIS_BLOCK COAL_ORE IRON_ORE GOLD_ORE EMERALD_ORE LAPIS_ORE
BEDROCK CLAY""".split()

def existe(rel):
    return os.path.isfile(os.path.join(SRC, rel + '.png'))

carte, copies = {}, set()
def noter(cle, rel):
    if rel and existe(rel):
        carte[cle] = rel.replace('/', '-')
        copies.add(rel)
for m, rel in EXCEPTIONS.items():
    noter(m, rel)
for m in SIMPLES:
    noter(m, 'items/' + m.lower() if existe('items/' + m.lower()) else 'blocks/' + m.lower())
for m, f in PAR_DONNEE.items():
    for d in range(16):
        noter(f'{m}:{d}', f(d))
for rel in ['items/potion_bottle_splash']:
    noter('POTION:splash', rel)

shutil.rmtree(DEST, ignore_errors=True)
os.makedirs(DEST)
for rel in sorted(copies):
    shutil.copyfile(os.path.join(SRC, rel + '.png'), os.path.join(DEST, rel.replace('/', '-') + '.png'))

with open(os.path.join(SITE, 'src', 'lib', 'items-sprites.ts'), 'w') as f:
    f.write("// GENERE par outils/generer-items.py — ne pas modifier a la main.\n")
    f.write("// Material Bukkit (ou « Material:donnee ») -> fichier de public/items, textures du client 1.8.9.\n")
    f.write('export const SPRITES: Record<string, string> = ' + json.dumps(dict(sorted(carte.items())), indent=2) + '\n')
taille = sum(os.path.getsize(os.path.join(DEST, x)) for x in os.listdir(DEST))
print(len(carte), 'entrees,', len(copies), 'images,', taille // 1024, 'Ko')
