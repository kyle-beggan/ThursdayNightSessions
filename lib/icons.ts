import { IconType } from 'react-icons';
import {
    GiGuitar,
    GiDrumKit,
    GiMicrophone,
    GiSaxophone,
    GiTrumpet,
    GiViolin,
    GiBanjo,
    GiDjembe,
    GiAccordion,
    GiMaracas,
    GiFlute,
    GiPianoKeys,
} from 'react-icons/gi';

export type InstrumentIconDefinition = {
    id: string; // The string saved to the DB (e.g. 'GiGuitar')
    label: string;
    icon: IconType;
};

export const INSTRUMENT_ICONS: InstrumentIconDefinition[] = [
    { id: 'GiGuitar', label: 'Guitar', icon: GiGuitar },
    { id: 'GiPianoKeys', label: 'Keyboard', icon: GiPianoKeys },
    { id: 'GiDrumKit', label: 'Drums', icon: GiDrumKit },
    { id: 'GiMicrophone', label: 'Vocals', icon: GiMicrophone },
    { id: 'GiSaxophone', label: 'Saxophone', icon: GiSaxophone },
    { id: 'GiTrumpet', label: 'Trumpet', icon: GiTrumpet },
    { id: 'GiViolin', label: 'Violin', icon: GiViolin },
    { id: 'GiBanjo', label: 'Banjo', icon: GiBanjo },
    { id: 'GiDjembe', label: 'Conga/Djembe', icon: GiDjembe },
    { id: 'GiAccordion', label: 'Accordion', icon: GiAccordion },
    { id: 'GiMaracas', label: 'Maracas', icon: GiMaracas },
    { id: 'GiFlute', label: 'Flute', icon: GiFlute },
];

export const ICON_MAP: Record<string, IconType> = INSTRUMENT_ICONS.reduce((acc, curr) => {
    acc[curr.id] = curr.icon;
    return acc;
}, {} as Record<string, IconType>);
