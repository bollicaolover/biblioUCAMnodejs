/**
 * Mapas de mesas de la Biblioteca UCAM (servicio 845).
 *
 * DISCOVERY: el campo `myturn_pitch` en make-booking acepta el ÍNDICE NUMÉRICO
 * de la mesa en el array pitches_names[] de get-services (base 1).
 * El campo `name` (ej. "Fila 1;Mesa 01") es el identificador legible,
 * pero la API de booking espera el índice numérico como string.
 *
 * pitches_names[0].name = "Fila 1;Mesa 01" → pitchIndex = "1"
 * pitches_names[1].name = "Fila 1;Mesa 02" → pitchIndex = "2"
 * ...y así sucesivamente en el orden del array de get-services.
 */

/**
 * Mapa nombre → índice numérico (pitchIndex).
 * Generado a partir de pitches_names[] de GET /myturner/api/get-services (id: 845).
 * Las filas 17 y 18 tienen un espacio extra ("Fila 17; Mesa 01") tal como viene de la API.
 */
export const PITCH_NAME_TO_INDEX: Record<string, string> = {
    // Fila 1 (índices 1–22)
    'Fila 1;Mesa 01': '1', 'Fila 1;Mesa 02': '2', 'Fila 1;Mesa 03': '3',
    'Fila 1;Mesa 04': '4', 'Fila 1;Mesa 05': '5', 'Fila 1;Mesa 06': '6',
    'Fila 1;Mesa 07': '7', 'Fila 1;Mesa 08': '8', 'Fila 1;Mesa 09': '9',
    'Fila 1;Mesa 10': '10', 'Fila 1;Mesa 11': '11', 'Fila 1;Mesa 12': '12',
    'Fila 1;Mesa 13': '13', 'Fila 1;Mesa 14': '14', 'Fila 1;Mesa 15': '15',
    'Fila 1;Mesa 16': '16', 'Fila 1;Mesa 17': '17', 'Fila 1;Mesa 18': '18',
    'Fila 1;Mesa 19': '19', 'Fila 1;Mesa 20': '20', 'Fila 1;Mesa 21': '21',
    'Fila 1;Mesa 22': '22',
    // Fila 2 (23–44)
    'Fila 2;Mesa 01': '23', 'Fila 2;Mesa 02': '24', 'Fila 2;Mesa 03': '25',
    'Fila 2;Mesa 04': '26', 'Fila 2;Mesa 05': '27', 'Fila 2;Mesa 06': '28',
    'Fila 2;Mesa 07': '29', 'Fila 2;Mesa 08': '30', 'Fila 2;Mesa 09': '31',
    'Fila 2;Mesa 10': '32', 'Fila 2;Mesa 11': '33', 'Fila 2;Mesa 12': '34',
    'Fila 2;Mesa 13': '35', 'Fila 2;Mesa 14': '36', 'Fila 2;Mesa 15': '37',
    'Fila 2;Mesa 16': '38', 'Fila 2;Mesa 17': '39', 'Fila 2;Mesa 18': '40',
    'Fila 2;Mesa 19': '41', 'Fila 2;Mesa 20': '42', 'Fila 2;Mesa 21': '43',
    'Fila 2;Mesa 22': '44',
    // Fila 3 (45–66)
    'Fila 3;Mesa 01': '45', 'Fila 3;Mesa 02': '46', 'Fila 3;Mesa 03': '47',
    'Fila 3;Mesa 04': '48', 'Fila 3;Mesa 05': '49', 'Fila 3;Mesa 06': '50',
    'Fila 3;Mesa 07': '51', 'Fila 3;Mesa 08': '52', 'Fila 3;Mesa 09': '53',
    'Fila 3;Mesa 10': '54', 'Fila 3;Mesa 11': '55', 'Fila 3;Mesa 12': '56',
    'Fila 3;Mesa 13': '57', 'Fila 3;Mesa 14': '58', 'Fila 3;Mesa 15': '59',
    'Fila 3;Mesa 16': '60', 'Fila 3;Mesa 17': '61', 'Fila 3;Mesa 18': '62',
    'Fila 3;Mesa 19': '63', 'Fila 3;Mesa 20': '64', 'Fila 3;Mesa 21': '65',
    'Fila 3;Mesa 22': '66',
    // Fila 4 (67–88)
    'Fila 4;Mesa 01': '67', 'Fila 4;Mesa 02': '68', 'Fila 4;Mesa 03': '69',
    'Fila 4;Mesa 04': '70', 'Fila 4;Mesa 05': '71', 'Fila 4;Mesa 06': '72',
    'Fila 4;Mesa 07': '73', 'Fila 4;Mesa 08': '74', 'Fila 4;Mesa 09': '75',
    'Fila 4;Mesa 10': '76', 'Fila 4;Mesa 11': '77', 'Fila 4;Mesa 12': '78',
    'Fila 4;Mesa 13': '79', 'Fila 4;Mesa 14': '80', 'Fila 4;Mesa 15': '81',
    'Fila 4;Mesa 16': '82', 'Fila 4;Mesa 17': '83', 'Fila 4;Mesa 18': '84',
    'Fila 4;Mesa 19': '85', 'Fila 4;Mesa 20': '86', 'Fila 4;Mesa 21': '87',
    'Fila 4;Mesa 22': '88',
    // Fila 5 (89–106)
    'Fila 5;Mesa 01': '89', 'Fila 5;Mesa 02': '90', 'Fila 5;Mesa 03': '91',
    'Fila 5;Mesa 04': '92', 'Fila 5;Mesa 05': '93', 'Fila 5;Mesa 06': '94',
    'Fila 5;Mesa 07': '95', 'Fila 5;Mesa 08': '96', 'Fila 5;Mesa 09': '97',
    'Fila 5;Mesa 10': '98', 'Fila 5;Mesa 11': '99', 'Fila 5;Mesa 12': '100',
    'Fila 5;Mesa 13': '101', 'Fila 5;Mesa 14': '102', 'Fila 5;Mesa 15': '103',
    'Fila 5;Mesa 16': '104', 'Fila 5;Mesa 17': '105', 'Fila 5;Mesa 18': '106',
    // Fila 6 (107–124)
    'Fila 6;Mesa 01': '107', 'Fila 6;Mesa 02': '108', 'Fila 6;Mesa 03': '109',
    'Fila 6;Mesa 04': '110', 'Fila 6;Mesa 05': '111', 'Fila 6;Mesa 06': '112',
    'Fila 6;Mesa 07': '113', 'Fila 6;Mesa 08': '114', 'Fila 6;Mesa 09': '115',
    'Fila 6;Mesa 10': '116', 'Fila 6;Mesa 11': '117', 'Fila 6;Mesa 12': '118',
    'Fila 6;Mesa 13': '119', 'Fila 6;Mesa 14': '120', 'Fila 6;Mesa 15': '121',
    'Fila 6;Mesa 16': '122', 'Fila 6;Mesa 17': '123', 'Fila 6;Mesa 18': '124',
    // Fila 7 (125–144)
    'Fila 7;Mesa 01': '125', 'Fila 7;Mesa 02': '126', 'Fila 7;Mesa 03': '127',
    'Fila 7;Mesa 04': '128', 'Fila 7;Mesa 05': '129', 'Fila 7;Mesa 06': '130',
    'Fila 7;Mesa 07': '131', 'Fila 7;Mesa 08': '132', 'Fila 7;Mesa 09': '133',
    'Fila 7;Mesa 10': '134', 'Fila 7;Mesa 11': '135', 'Fila 7;Mesa 12': '136',
    'Fila 7;Mesa 13': '137', 'Fila 7;Mesa 14': '138', 'Fila 7;Mesa 15': '139',
    'Fila 7;Mesa 16': '140', 'Fila 7;Mesa 17': '141', 'Fila 7;Mesa 18': '142',
    'Fila 7;Mesa 19': '143', 'Fila 7;Mesa 20': '144',
    // Fila 8 (145–164)
    'Fila 8;Mesa 01': '145', 'Fila 8;Mesa 02': '146', 'Fila 8;Mesa 03': '147',
    'Fila 8;Mesa 04': '148', 'Fila 8;Mesa 05': '149', 'Fila 8;Mesa 06': '150',
    'Fila 8;Mesa 07': '151', 'Fila 8;Mesa 08': '152', 'Fila 8;Mesa 09': '153',
    'Fila 8;Mesa 10': '154', 'Fila 8;Mesa 11': '155', 'Fila 8;Mesa 12': '156',
    'Fila 8;Mesa 13': '157', 'Fila 8;Mesa 14': '158', 'Fila 8;Mesa 15': '159',
    'Fila 8;Mesa 16': '160', 'Fila 8;Mesa 17': '161', 'Fila 8;Mesa 18': '162',
    'Fila 8;Mesa 19': '163', 'Fila 8;Mesa 20': '164',
    // Fila 9 (165–184)
    'Fila 9;Mesa 01': '165', 'Fila 9;Mesa 02': '166', 'Fila 9;Mesa 03': '167',
    'Fila 9;Mesa 04': '168', 'Fila 9;Mesa 05': '169', 'Fila 9;Mesa 06': '170',
    'Fila 9;Mesa 07': '171', 'Fila 9;Mesa 08': '172', 'Fila 9;Mesa 09': '173',
    'Fila 9;Mesa 10': '174', 'Fila 9;Mesa 11': '175', 'Fila 9;Mesa 12': '176',
    'Fila 9;Mesa 13': '177', 'Fila 9;Mesa 14': '178', 'Fila 9;Mesa 15': '179',
    'Fila 9;Mesa 16': '180', 'Fila 9;Mesa 17': '181', 'Fila 9;Mesa 18': '182',
    'Fila 9;Mesa 19': '183', 'Fila 9;Mesa 20': '184',
    // Fila 10 (185–204)
    'Fila 10;Mesa 01': '185', 'Fila 10;Mesa 02': '186', 'Fila 10;Mesa 03': '187',
    'Fila 10;Mesa 04': '188', 'Fila 10;Mesa 05': '189', 'Fila 10;Mesa 06': '190',
    'Fila 10;Mesa 07': '191', 'Fila 10;Mesa 08': '192', 'Fila 10;Mesa 09': '193',
    'Fila 10;Mesa 10': '194', 'Fila 10;Mesa 11': '195', 'Fila 10;Mesa 12': '196',
    'Fila 10;Mesa 13': '197', 'Fila 10;Mesa 14': '198', 'Fila 10;Mesa 15': '199',
    'Fila 10;Mesa 16': '200', 'Fila 10;Mesa 17': '201', 'Fila 10;Mesa 18': '202',
    'Fila 10;Mesa 19': '203', 'Fila 10;Mesa 20': '204',
    // Fila 11 (205–224)
    'Fila 11;Mesa 01': '205', 'Fila 11;Mesa 02': '206', 'Fila 11;Mesa 03': '207',
    'Fila 11;Mesa 04': '208', 'Fila 11;Mesa 05': '209', 'Fila 11;Mesa 06': '210',
    'Fila 11;Mesa 07': '211', 'Fila 11;Mesa 08': '212', 'Fila 11;Mesa 09': '213',
    'Fila 11;Mesa 10': '214', 'Fila 11;Mesa 11': '215', 'Fila 11;Mesa 12': '216',
    'Fila 11;Mesa 13': '217', 'Fila 11;Mesa 14': '218', 'Fila 11;Mesa 15': '219',
    'Fila 11;Mesa 16': '220', 'Fila 11;Mesa 17': '221', 'Fila 11;Mesa 18': '222',
    'Fila 11;Mesa 19': '223', 'Fila 11;Mesa 20': '224',
    // Fila 12 (225–244)
    'Fila 12;Mesa 01': '225', 'Fila 12;Mesa 02': '226', 'Fila 12;Mesa 03': '227',
    'Fila 12;Mesa 04': '228', 'Fila 12;Mesa 05': '229', 'Fila 12;Mesa 06': '230',
    'Fila 12;Mesa 07': '231', 'Fila 12;Mesa 08': '232', 'Fila 12;Mesa 09': '233',
    'Fila 12;Mesa 10': '234', 'Fila 12;Mesa 11': '235', 'Fila 12;Mesa 12': '236',
    'Fila 12;Mesa 13': '237', 'Fila 12;Mesa 14': '238', 'Fila 12;Mesa 15': '239',
    'Fila 12;Mesa 16': '240', 'Fila 12;Mesa 17': '241', 'Fila 12;Mesa 18': '242',
    'Fila 12;Mesa 19': '243', 'Fila 12;Mesa 20': '244',
    // Fila 13 (245–246)
    'Fila 13;Mesa 01': '245', 'Fila 13;Mesa 02': '246',
    // Fila 14 (247–248)
    'Fila 14;Mesa 01': '247', 'Fila 14;Mesa 02': '248',
    // Fila 15 (249–260)
    'Fila 15;Mesa 01': '249', 'Fila 15;Mesa 02': '250', 'Fila 15;Mesa 03': '251',
    'Fila 15;Mesa 04': '252', 'Fila 15;Mesa 05': '253', 'Fila 15;Mesa 06': '254',
    'Fila 15;Mesa 07': '255', 'Fila 15;Mesa 08': '256', 'Fila 15;Mesa 09': '257',
    'Fila 15;Mesa 10': '258', 'Fila 15;Mesa 11': '259', 'Fila 15;Mesa 12': '260',
    // Fila 16 (261–272)
    'Fila 16;Mesa 01': '261', 'Fila 16;Mesa 02': '262', 'Fila 16;Mesa 03': '263',
    'Fila 16;Mesa 04': '264', 'Fila 16;Mesa 05': '265', 'Fila 16;Mesa 06': '266',
    'Fila 16;Mesa 07': '267', 'Fila 16;Mesa 08': '268', 'Fila 16;Mesa 09': '269',
    'Fila 16;Mesa 10': '270', 'Fila 16;Mesa 11': '271', 'Fila 16;Mesa 12': '272',
    // Filas 17 y 18 tienen espacio extra en la API: "Fila 17; Mesa 01"
    'Fila 17; Mesa 01': '273', 'Fila 17; Mesa 02': '274', 'Fila 17; Mesa 03': '275',
    'Fila 17; Mesa 04': '276', 'Fila 17; Mesa 05': '277', 'Fila 17; Mesa 06': '278',
    'Fila 17; Mesa 07': '279', 'Fila 17; Mesa 08': '280', 'Fila 17; Mesa 09': '281',
    'Fila 17; Mesa 10': '282', 'Fila 17; Mesa 11': '283', 'Fila 17; Mesa 12': '284',
    'Fila 18; Mesa 01': '285', 'Fila 18; Mesa 02': '286', 'Fila 18; Mesa 03': '287',
    'Fila 18; Mesa 04': '288', 'Fila 18; Mesa 05': '289', 'Fila 18; Mesa 06': '290',
    'Fila 18; Mesa 07': '291', 'Fila 18; Mesa 08': '292', 'Fila 18; Mesa 09': '293',
    'Fila 18; Mesa 10': '294', 'Fila 18; Mesa 11': '295', 'Fila 18; Mesa 12': '296',
};

/**
 * Obtiene el pitchIndex numérico (para make-booking) a partir del nombre de la mesa.
 * Las keys en SEATS son los nombres de la API (ej. "Fila 1;Mesa 01").
 */
export function getPitchIndex(pitchName: string): string {
    return PITCH_NAME_TO_INDEX[pitchName] ?? pitchName;
}

/**
 * SEATS: fila → mesa → nombre de la API (pitchName).
 * El pitchName es el campo `name` en pitches_names[] de get-services.
 * Para reservar, usar getPitchIndex(pitchName).
 */
export const SEATS: Record<number, Record<number, string>> = {
    1: { 1: 'Fila 1;Mesa 01', 2: 'Fila 1;Mesa 02', 3: 'Fila 1;Mesa 03', 4: 'Fila 1;Mesa 04', 5: 'Fila 1;Mesa 05', 6: 'Fila 1;Mesa 06', 7: 'Fila 1;Mesa 07', 8: 'Fila 1;Mesa 08', 9: 'Fila 1;Mesa 09', 10: 'Fila 1;Mesa 10', 11: 'Fila 1;Mesa 11', 12: 'Fila 1;Mesa 12', 13: 'Fila 1;Mesa 13', 14: 'Fila 1;Mesa 14', 15: 'Fila 1;Mesa 15', 16: 'Fila 1;Mesa 16', 17: 'Fila 1;Mesa 17', 18: 'Fila 1;Mesa 18', 19: 'Fila 1;Mesa 19', 20: 'Fila 1;Mesa 20', 21: 'Fila 1;Mesa 21', 22: 'Fila 1;Mesa 22' },
    2: { 1: 'Fila 2;Mesa 01', 2: 'Fila 2;Mesa 02', 3: 'Fila 2;Mesa 03', 4: 'Fila 2;Mesa 04', 5: 'Fila 2;Mesa 05', 6: 'Fila 2;Mesa 06', 7: 'Fila 2;Mesa 07', 8: 'Fila 2;Mesa 08', 9: 'Fila 2;Mesa 09', 10: 'Fila 2;Mesa 10', 11: 'Fila 2;Mesa 11', 12: 'Fila 2;Mesa 12', 13: 'Fila 2;Mesa 13', 14: 'Fila 2;Mesa 14', 15: 'Fila 2;Mesa 15', 16: 'Fila 2;Mesa 16', 17: 'Fila 2;Mesa 17', 18: 'Fila 2;Mesa 18', 19: 'Fila 2;Mesa 19', 20: 'Fila 2;Mesa 20', 21: 'Fila 2;Mesa 21', 22: 'Fila 2;Mesa 22' },
    3: { 1: 'Fila 3;Mesa 01', 2: 'Fila 3;Mesa 02', 3: 'Fila 3;Mesa 03', 4: 'Fila 3;Mesa 04', 5: 'Fila 3;Mesa 05', 6: 'Fila 3;Mesa 06', 7: 'Fila 3;Mesa 07', 8: 'Fila 3;Mesa 08', 9: 'Fila 3;Mesa 09', 10: 'Fila 3;Mesa 10', 11: 'Fila 3;Mesa 11', 12: 'Fila 3;Mesa 12', 13: 'Fila 3;Mesa 13', 14: 'Fila 3;Mesa 14', 15: 'Fila 3;Mesa 15', 16: 'Fila 3;Mesa 16', 17: 'Fila 3;Mesa 17', 18: 'Fila 3;Mesa 18', 19: 'Fila 3;Mesa 19', 20: 'Fila 3;Mesa 20', 21: 'Fila 3;Mesa 21', 22: 'Fila 3;Mesa 22' },
    4: { 1: 'Fila 4;Mesa 01', 2: 'Fila 4;Mesa 02', 3: 'Fila 4;Mesa 03', 4: 'Fila 4;Mesa 04', 5: 'Fila 4;Mesa 05', 6: 'Fila 4;Mesa 06', 7: 'Fila 4;Mesa 07', 8: 'Fila 4;Mesa 08', 9: 'Fila 4;Mesa 09', 10: 'Fila 4;Mesa 10', 11: 'Fila 4;Mesa 11', 12: 'Fila 4;Mesa 12', 13: 'Fila 4;Mesa 13', 14: 'Fila 4;Mesa 14', 15: 'Fila 4;Mesa 15', 16: 'Fila 4;Mesa 16', 17: 'Fila 4;Mesa 17', 18: 'Fila 4;Mesa 18', 19: 'Fila 4;Mesa 19', 20: 'Fila 4;Mesa 20', 21: 'Fila 4;Mesa 21', 22: 'Fila 4;Mesa 22' },
    5: { 1: 'Fila 5;Mesa 01', 2: 'Fila 5;Mesa 02', 3: 'Fila 5;Mesa 03', 4: 'Fila 5;Mesa 04', 5: 'Fila 5;Mesa 05', 6: 'Fila 5;Mesa 06', 7: 'Fila 5;Mesa 07', 8: 'Fila 5;Mesa 08', 9: 'Fila 5;Mesa 09', 10: 'Fila 5;Mesa 10', 11: 'Fila 5;Mesa 11', 12: 'Fila 5;Mesa 12', 13: 'Fila 5;Mesa 13', 14: 'Fila 5;Mesa 14', 15: 'Fila 5;Mesa 15', 16: 'Fila 5;Mesa 16', 17: 'Fila 5;Mesa 17', 18: 'Fila 5;Mesa 18' },
    6: { 1: 'Fila 6;Mesa 01', 2: 'Fila 6;Mesa 02', 3: 'Fila 6;Mesa 03', 4: 'Fila 6;Mesa 04', 5: 'Fila 6;Mesa 05', 6: 'Fila 6;Mesa 06', 7: 'Fila 6;Mesa 07', 8: 'Fila 6;Mesa 08', 9: 'Fila 6;Mesa 09', 10: 'Fila 6;Mesa 10', 11: 'Fila 6;Mesa 11', 12: 'Fila 6;Mesa 12', 13: 'Fila 6;Mesa 13', 14: 'Fila 6;Mesa 14', 15: 'Fila 6;Mesa 15', 16: 'Fila 6;Mesa 16', 17: 'Fila 6;Mesa 17', 18: 'Fila 6;Mesa 18' },
    7: { 1: 'Fila 7;Mesa 01', 2: 'Fila 7;Mesa 02', 3: 'Fila 7;Mesa 03', 4: 'Fila 7;Mesa 04', 5: 'Fila 7;Mesa 05', 6: 'Fila 7;Mesa 06', 7: 'Fila 7;Mesa 07', 8: 'Fila 7;Mesa 08', 9: 'Fila 7;Mesa 09', 10: 'Fila 7;Mesa 10', 11: 'Fila 7;Mesa 11', 12: 'Fila 7;Mesa 12', 13: 'Fila 7;Mesa 13', 14: 'Fila 7;Mesa 14', 15: 'Fila 7;Mesa 15', 16: 'Fila 7;Mesa 16', 17: 'Fila 7;Mesa 17', 18: 'Fila 7;Mesa 18', 19: 'Fila 7;Mesa 19', 20: 'Fila 7;Mesa 20' },
    8: { 1: 'Fila 8;Mesa 01', 2: 'Fila 8;Mesa 02', 3: 'Fila 8;Mesa 03', 4: 'Fila 8;Mesa 04', 5: 'Fila 8;Mesa 05', 6: 'Fila 8;Mesa 06', 7: 'Fila 8;Mesa 07', 8: 'Fila 8;Mesa 08', 9: 'Fila 8;Mesa 09', 10: 'Fila 8;Mesa 10', 11: 'Fila 8;Mesa 11', 12: 'Fila 8;Mesa 12', 13: 'Fila 8;Mesa 13', 14: 'Fila 8;Mesa 14', 15: 'Fila 8;Mesa 15', 16: 'Fila 8;Mesa 16', 17: 'Fila 8;Mesa 17', 18: 'Fila 8;Mesa 18', 19: 'Fila 8;Mesa 19', 20: 'Fila 8;Mesa 20' },
    9: { 1: 'Fila 9;Mesa 01', 2: 'Fila 9;Mesa 02', 3: 'Fila 9;Mesa 03', 4: 'Fila 9;Mesa 04', 5: 'Fila 9;Mesa 05', 6: 'Fila 9;Mesa 06', 7: 'Fila 9;Mesa 07', 8: 'Fila 9;Mesa 08', 9: 'Fila 9;Mesa 09', 10: 'Fila 9;Mesa 10', 11: 'Fila 9;Mesa 11', 12: 'Fila 9;Mesa 12', 13: 'Fila 9;Mesa 13', 14: 'Fila 9;Mesa 14', 15: 'Fila 9;Mesa 15', 16: 'Fila 9;Mesa 16', 17: 'Fila 9;Mesa 17', 18: 'Fila 9;Mesa 18', 19: 'Fila 9;Mesa 19', 20: 'Fila 9;Mesa 20' },
    10: { 1: 'Fila 10;Mesa 01', 2: 'Fila 10;Mesa 02', 3: 'Fila 10;Mesa 03', 4: 'Fila 10;Mesa 04', 5: 'Fila 10;Mesa 05', 6: 'Fila 10;Mesa 06', 7: 'Fila 10;Mesa 07', 8: 'Fila 10;Mesa 08', 9: 'Fila 10;Mesa 09', 10: 'Fila 10;Mesa 10', 11: 'Fila 10;Mesa 11', 12: 'Fila 10;Mesa 12', 13: 'Fila 10;Mesa 13', 14: 'Fila 10;Mesa 14', 15: 'Fila 10;Mesa 15', 16: 'Fila 10;Mesa 16', 17: 'Fila 10;Mesa 17', 18: 'Fila 10;Mesa 18', 19: 'Fila 10;Mesa 19', 20: 'Fila 10;Mesa 20' },
    11: { 1: 'Fila 11;Mesa 01', 2: 'Fila 11;Mesa 02', 3: 'Fila 11;Mesa 03', 4: 'Fila 11;Mesa 04', 5: 'Fila 11;Mesa 05', 6: 'Fila 11;Mesa 06', 7: 'Fila 11;Mesa 07', 8: 'Fila 11;Mesa 08', 9: 'Fila 11;Mesa 09', 10: 'Fila 11;Mesa 10', 11: 'Fila 11;Mesa 11', 12: 'Fila 11;Mesa 12', 13: 'Fila 11;Mesa 13', 14: 'Fila 11;Mesa 14', 15: 'Fila 11;Mesa 15', 16: 'Fila 11;Mesa 16', 17: 'Fila 11;Mesa 17', 18: 'Fila 11;Mesa 18', 19: 'Fila 11;Mesa 19', 20: 'Fila 11;Mesa 20' },
    12: { 1: 'Fila 12;Mesa 01', 2: 'Fila 12;Mesa 02', 3: 'Fila 12;Mesa 03', 4: 'Fila 12;Mesa 04', 5: 'Fila 12;Mesa 05', 6: 'Fila 12;Mesa 06', 7: 'Fila 12;Mesa 07', 8: 'Fila 12;Mesa 08', 9: 'Fila 12;Mesa 09', 10: 'Fila 12;Mesa 10', 11: 'Fila 12;Mesa 11', 12: 'Fila 12;Mesa 12', 13: 'Fila 12;Mesa 13', 14: 'Fila 12;Mesa 14', 15: 'Fila 12;Mesa 15', 16: 'Fila 12;Mesa 16', 17: 'Fila 12;Mesa 17', 18: 'Fila 12;Mesa 18', 19: 'Fila 12;Mesa 19', 20: 'Fila 12;Mesa 20' },
    13: { 1: 'Fila 13;Mesa 01', 2: 'Fila 13;Mesa 02' },
    14: { 1: 'Fila 14;Mesa 01', 2: 'Fila 14;Mesa 02' },
    15: { 1: 'Fila 15;Mesa 01', 2: 'Fila 15;Mesa 02', 3: 'Fila 15;Mesa 03', 4: 'Fila 15;Mesa 04', 5: 'Fila 15;Mesa 05', 6: 'Fila 15;Mesa 06', 7: 'Fila 15;Mesa 07', 8: 'Fila 15;Mesa 08', 9: 'Fila 15;Mesa 09', 10: 'Fila 15;Mesa 10', 11: 'Fila 15;Mesa 11', 12: 'Fila 15;Mesa 12' },
    16: { 1: 'Fila 16;Mesa 01', 2: 'Fila 16;Mesa 02', 3: 'Fila 16;Mesa 03', 4: 'Fila 16;Mesa 04', 5: 'Fila 16;Mesa 05', 6: 'Fila 16;Mesa 06', 7: 'Fila 16;Mesa 07', 8: 'Fila 16;Mesa 08', 9: 'Fila 16;Mesa 09', 10: 'Fila 16;Mesa 10', 11: 'Fila 16;Mesa 11', 12: 'Fila 16;Mesa 12' },
    17: { 1: 'Fila 17; Mesa 01', 2: 'Fila 17; Mesa 02', 3: 'Fila 17; Mesa 03', 4: 'Fila 17; Mesa 04', 5: 'Fila 17; Mesa 05', 6: 'Fila 17; Mesa 06', 7: 'Fila 17; Mesa 07', 8: 'Fila 17; Mesa 08', 9: 'Fila 17; Mesa 09', 10: 'Fila 17; Mesa 10', 11: 'Fila 17; Mesa 11', 12: 'Fila 17; Mesa 12' },
    18: { 1: 'Fila 18; Mesa 01', 2: 'Fila 18; Mesa 02', 3: 'Fila 18; Mesa 03', 4: 'Fila 18; Mesa 04', 5: 'Fila 18; Mesa 05', 6: 'Fila 18; Mesa 06', 7: 'Fila 18; Mesa 07', 8: 'Fila 18; Mesa 08', 9: 'Fila 18; Mesa 09', 10: 'Fila 18; Mesa 10', 11: 'Fila 18; Mesa 11', 12: 'Fila 18; Mesa 12' },
};

export function getSeatPitchId(row: number, seat: number): string {
    const rowData = SEATS[row];
    if (!rowData) throw new Error(`Fila ${row} no encontrada`);
    const name = rowData[seat];
    if (!name) throw new Error(`Mesa ${seat} no encontrada en fila ${row}`);
    return name;
}

export function findSeatByPitchId(pitchName: string): { row: number; seat: number } | null {
    for (const [rowStr, rowData] of Object.entries(SEATS)) {
        for (const [seatStr, name] of Object.entries(rowData)) {
            if (name === pitchName) return { row: Number(rowStr), seat: Number(seatStr) };
        }
    }
    return null;
}
