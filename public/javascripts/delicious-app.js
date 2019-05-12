import '../sass/style.scss';
import makeMap from './modules/map';
import { $, $$ } from './modules/bling';

import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import ajaxHeart from './modules/heart';

autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search' ))

makeMap( $('#map') );

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);