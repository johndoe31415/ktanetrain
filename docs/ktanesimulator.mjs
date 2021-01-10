/*
	ktanetrain - "Keep Talking and Nobody Explodes" morse trainer
	Copyright (C) 2021-2021 Johannes Bauer

	This file is part of ktanetrain.

	ktanetrain is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; this program is ONLY licensed under
	version 3 of the License, later versions are explicitly excluded.

	ktanetrain is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with ktanetrain; if not, write to the Free Software
	Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

	Johannes Bauer <JohannesBauer@gmx.de>
*/

export class KTaNESimulator {
	constructor(ui_elements) {
		this._ui_elements = ui_elements;
		this._active = false;
		this._index = 0;
		this._string = [ ];
		this._metadata = null;
		this._load_metadata();
		this._register_events();
	}

	_load_metadata() {
		fetch("metadata.json").then(response => {
			if (response.status == 200) {
				return response.json();
			}
		}).then(metadata => {
			this._metadata = metadata;
			this._on_randomize();
			this._next_symbol();
		});
	}

	_register_events() {
		this._ui_elements["btn-reveal"].addEventListener("click", event => this._on_reveal(event));
		this._ui_elements["btn-randomize"].addEventListener("click", event => this._on_randomize(event));
		this._ui_elements["select-words"].addEventListener("change", event => this._on_randomize(event));
	}

	_set_image(led_on) {
		this._ui_elements["img_bomb"].src = led_on ? "on.png" : "off.png";
	}

	_random_choice(alphabet) {
		const index = Math.floor(Math.random() * alphabet.length);
		return alphabet[index];
	}

	_randomize_word() {
		const alphabet_name = this._ui_elements["select-words"].value;
		const alphabet = this._metadata["words"][alphabet_name];
		let word = "";
		if (typeof(alphabet) == "string") {
			const length = 5 + Math.floor(Math.random() * 2);
			for (let i = 0; i < length; i++) {
				word += this._random_choice(alphabet);
			}
		} else {
			word = this._random_choice(alphabet);
		}
		return word;
	}

	_transcribe_letter(letter) {
		const morse_code = this._metadata["alphabet"][letter];
		let string = [ ];
		for (let code of morse_code) {
			if (code == ".") {
				string.push({ "state": true, "duration": this._metadata["display"]["short"], "show": letter });
				string.push({ "state": false, "duration": this._metadata["display"]["symbol_gap"], "show": letter });
			} else {
				string.push({ "state": true, "duration": this._metadata["display"]["long"], "show": letter });
				string.push({ "state": false, "duration": this._metadata["display"]["symbol_gap"], "show": letter });
			}
		}
		return string;
	}

	_transcribe_word(word) {
		let string = [ ];
		for (let letter of word) {
			string = string.concat(this._transcribe_letter(letter));
			string.push({ "state": false, "duration": this._metadata["display"]["letter_gap"], "show": "" });
		}
		return string;
	}

	_transcribe_word_morse(word) {
		let morse = "";
		for (let letter of word) {
			morse += "<span class=\"letter\">" + this._metadata["alphabet"][letter] + "</span>";
		}
		morse = morse.replace(/\./g, "<span class=\"symbol\">·</span>");
		morse = morse.replace(/-/g, "<span class=\"symbol\">–</span>");
		return morse;
	}

	_randomize() {
		const word = this._randomize_word();
		this._string = this._transcribe_word(word);
		this._ui_elements["solution-word"].innerText = word;
		this._ui_elements["solution-morse"].innerHTML = this._transcribe_word_morse(word);
		this._index = Math.floor(Math.random() * this._string.length);
	}

	_show_symbol(symbol) {
		this._set_image(symbol["state"]);
		this._ui_elements["solution-current"].innerText = symbol["show"];
		let scale_factor = this._ui_elements["scale-factor"].value * 1.0;
		if (scale_factor != scale_factor) {
			/* NaN */
			scale_factor = 1.0;
		} else if (scale_factor < 0.01) {
			scale_factor = 0.01;
		} else if (scale_factor > 100) {
			scale_factor = 100;
		}
		setTimeout(event => this._next_symbol(), symbol["duration"] * scale_factor * 1000);
	}

	_next_symbol() {
		let symbol = null;
		if (this._index >= this._string.length) {
			symbol = { "state": false, "duration": this._metadata["display"]["word_gap"], "show": "Start" };
			this._index = 0;
		} else {
			symbol = this._string[this._index];
			this._index = this._index + 1;
		}
		this._show_symbol(symbol);
	}

	_show_solution(do_show) {
		if (do_show) {
			this._ui_elements["solution"].classList.remove("invisible");
		} else {
			this._ui_elements["solution"].classList.add("invisible");
		}
	}

	_on_reveal() {
		this._show_solution(true);
	}

	_on_randomize() {
		this._set_image(false);
		this._show_solution(false);
		this._randomize();
	}
}
