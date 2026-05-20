export interface AcsCheckpointOption {
  value: string;
  label: string;
  address: string;
}

// Source: ACS Cyprus network locations PDF, cyp.acscourier.net, checked May 2026.
export const ACS_CHECKPOINT_OPTIONS: AcsCheckpointOption[] = [
  { value: 'ACS001', label: 'Nicosia - Ay.Dometios', address: '9 Prigkipos Karolou, 2373 Ag. Dometios' },
  { value: 'ACS002', label: 'Nicosia - Eleftherias Square', address: '6A Con. Palaiologou Str, 1011 Nicosia' },
  { value: 'ACS003', label: 'Nicosia - Michalakopoulou', address: '22 Michalacopoulou Str, 1075 Nicosia' },
  { value: 'ACS004', label: 'Nicosia - Strovolos', address: '70 Athalassas Ave, 2012 Strovolos' },
  { value: 'ACS005', label: 'Nicosia - Engomi', address: '34B October 28th Str, 2414 Engomi' },
  { value: 'ACS006', label: 'Nicosia - Lakatamia', address: '40H Makariou Ave, 2324 Lakatamia' },
  { value: 'ACS007', label: 'Nicosia - Strakka', address: '351 Arch. Makariou III, 2313 Pano Lakatamia' },
  { value: 'ACS008', label: 'Nicosia - Pallouriotissa', address: '9 Kyriakou Matsi, 1035 Pallouriotissa' },
  { value: 'ACS009', label: 'Nicosia - Varkizas', address: '14 Varkizas Str, 2033 Strovolos Ind.Area' },
  { value: 'ACS010', label: 'Nicosia - Latsia Kranidioti', address: '106 Giannou Kranidioti, 2231 Latsia' },
  { value: 'ACS011', label: 'Nicosia - Kokkinotrimithia', address: '2 Gr. Afxentiou & Avlonas, 2660 Kokkinotrimithia' },
  { value: 'ACS012', label: 'Nicosia - Pera Chorio Nisou', address: '27C Makariou Ave, 2572 Pera Chorio Nisou' },
  { value: 'ACS013', label: 'Nicosia - Platy Aglantzias', address: '143 Kyrenias Avenue, 2113 Aglantzia' },
  { value: 'ACS014', label: 'Nicosia - Lythrodontas', address: '62A Makariou Avenue, 2565 Nicosia' },
  { value: 'ACS015', label: 'Nicosia - Astromeritis', address: '70A Grivas Digenis Ave, 2722 Astromeritis' },
  { value: 'ACS016', label: 'Nicosia - Arediou', address: '29A Griva Digeni, 2614 Arediou' },
  { value: 'ACS017', label: 'Nicosia - Palaichori', address: '22 Polykarpou Giorkatzi Ave, 2745 Palaichori' },
  { value: 'ACS018', label: 'Limassol - Tsireio', address: '41 Stelios Kyriakides Str, 3080 Limassol' },
  { value: 'ACS019', label: 'Limassol - Agios Nicolaos', address: '3 Riga Feraiou Str, 3095 Limassol' },
  { value: 'ACS020', label: 'Limassol - Omonoia', address: '35A Vasileos Pavlou Str, 3052 Limassol' },
  { value: 'ACS021', label: 'Limassol - Kolonakiou', address: '17 Sp. Kyprianos Ave, 4043 Yermasoyia' },
  { value: 'ACS022', label: 'Limassol - Ypsonas', address: '38 Elia Kannaourou Str, 4187 Ypsonas' },
  { value: 'ACS023', label: 'Limassol - Tzamouda', address: '18 June 16th 1943, 30422 Limassol' },
  { value: 'ACS024', label: 'Limassol - Ag.Tychonas', address: '13 Onisilou Str, 4532 Ag. Tychonas' },
  { value: 'ACS025', label: 'Limassol - Ag. Athanasios', address: '2 Iapetou, 4041 Limassol' },
  { value: 'ACS026', label: 'Limassol - Episkopi', address: '31 Arch. Makariou, 4620 Episkopi' },
  { value: 'ACS027', label: 'Limassol - Agros', address: '17 Stelios Chatzipetris Str, Agros' },
  { value: 'ACS028', label: 'Limassol - Pissouri', address: '57C Ampelonon Str, 4607 Pissouri' },
  { value: 'ACS029', label: 'Larnaca - Aradippou', address: '127 Arch. Makariou III Ave, 7102 Aradippou' },
  { value: 'ACS030', label: 'Larnaca - Larnaka Centre', address: '18 Arch. Kyprianos Str, 6016 Larnaca' },
  { value: 'ACS031', label: 'Larnaca - Drosia', address: '14 1st April, 6035 Larnaca' },
  { value: 'ACS032', label: 'Larnaca - Artemidos', address: '24 Artemidos Ave, 6030 Larnaca (Airport Road)' },
  { value: 'ACS033', label: 'Larnaca - Xylofagou', address: '16 Eleutherias Str, 7520 Xylofagou' },
  { value: 'ACS034', label: 'Larnaca - Ormidia', address: '21 Metochiou Str, 7530 Ormidia' },
  { value: 'ACS035', label: 'Larnaca - Athienou', address: '12 Venizelou Str, 7600 Athienou' },
  { value: 'ACS036', label: 'Larnaca - Kiti', address: '56 Arch. Makarios Str, 7550 Kiti' },
  { value: 'ACS037', label: 'Larnaca - Choirokoitia', address: '41 Agias Paraskevis Str, 7741 Choirokoitia' },
  { value: 'ACS038', label: 'Larnaca - Kornos', address: '102A Arch. Makariou Str, 7640 Kornos' },
  { value: 'ACS039', label: 'Paphos - Paphos', address: '55 Mesogis Ave, 8280 Paphos' },
  { value: 'ACS040', label: 'Paphos - Paphos Courts', address: '4 N.Nikolaide & Kynira Str, 8010 Paphos' },
  { value: 'ACS041', label: 'Paphos - Polis Chrysochous', address: '11 Vasileos Stasioikou, 8820 Poli Chrysochous' },
  { value: 'ACS042', label: 'Paphos - Chloraka', address: 'Chlorakas Avenue, 8220 Chloraka' },
  { value: 'ACS043', label: 'Ammochostos - Paralimni', address: '84 Stadiou Str, 5280 Paralimni' },
  { value: 'ACS044', label: 'Ammochostos - Ayia Napa', address: '1 Dionysiou Solomou Str, 5330 Ayia Napa' },
  { value: 'ACS045', label: 'Ammochostos - Liopetri', address: '5 April 1st Ave, 5320 Liopetri' },
  { value: 'ACS046', label: 'Ammochostos - Derynia', address: '4 Eleutherias Str, 5380 Derynia' },
];

export function getAcsCheckpointByValue(value: string | null | undefined): AcsCheckpointOption | null {
  if (!value) return null;
  return ACS_CHECKPOINT_OPTIONS.find((option) => option.value === value) ?? null;
}

export function formatAcsCheckpoint(value: string | null | undefined): string | null {
  const checkpoint = getAcsCheckpointByValue(value);
  if (!checkpoint) return value || null;
  return `${checkpoint.label} - ${checkpoint.address}`;
}
