const CustomTheme = {
	data: {
		main_font: '',
		headline_font: '',
		code_font: '',
		css: '',
		colors: {}
	},
	defaultColors: {
		ui: '#282c34',
		back: '#21252b',
		dark: '#17191d',
		border: '#181a1f',
		selected: '#474d5d',
		button: '#3a3f4b',
		bright_ui: '#f4f3ff',
		accent: '#3e90ff',
		frame: '#181a1f',
		text: '#cacad4',
		light: '#f4f3ff',
		accent_text: '#000006',
		subtle_text: '#848891',
		grid: '#495061',
		wireframe: '#576f82',
		checkerboard: '#1c2026',
	},
	setup() {

		for (var key in CustomTheme.defaultColors) {
			CustomTheme.data.colors[key] = CustomTheme.defaultColors[key];
		}

		function saveChanges() {
			localStorage.setItem('theme', JSON.stringify(CustomTheme.data));
		}

		CustomTheme.vue = new Vue({
			el: '#theme_editor',
			data: CustomTheme.data,
			components: {
				VuePrismEditor
			},
			watch: {
				main_font() {
					document.body.style.setProperty('--font-custom-main', CustomTheme.data.main_font);
					saveChanges();
				},
				headline_font() {
					document.body.style.setProperty('--font-custom-headline', CustomTheme.data.headline_font);
					saveChanges();
				},
				code_font() {
					document.body.style.setProperty('--font-custom-code', CustomTheme.data.code_font);
					saveChanges();
				},
				css() {
					$('style#theme_css').text(CustomTheme.data.css);
					saveChanges();
				},
				colors: {
					handler() {
						for (var key in CustomTheme.data.colors) {
							var hex = CustomTheme.data.colors[key];
							document.body.style.setProperty('--color-'+key, hex);
						}
						$('meta[name=theme-color]').attr('content', CustomTheme.data.colors.frame);

						var c_outline = parseInt('0x'+CustomTheme.data.colors.accent.replace('#', ''))
						if (c_outline !== gizmo_colors.outline.getHex()) {
							gizmo_colors.outline.set(c_outline)
							Canvas.outlineMaterial.color = gizmo_colors.outline
						}
						var c_wire = parseInt('0x'+CustomTheme.data.colors.wireframe.replace('#', ''))
						if (c_wire !== gizmo_colors.wire.getHex()) {
							gizmo_colors.wire.set(c_wire);
							Canvas.wireframeMaterial.color = gizmo_colors.wire;
						}

						var c_grid = parseInt('0x'+CustomTheme.data.colors.grid.replace('#', ''))
						if (c_grid !== gizmo_colors.grid.getHex()) {
							gizmo_colors.grid.set(c_grid);
							three_grid.children.forEach(c => {
								if (c.name === 'grid' && c.material) {
									c.material.color = gizmo_colors.grid;
								}
							})
						}

						saveChanges();
					},
					deep: true
				},

			}
		})
		Vue.nextTick(function() {
			CustomTheme.fetchFromStorage();
		})
	},
	setupDialog() {
		var wrapper = $('#color_wrapper');
		for (var key in CustomTheme.defaultColors) {
			(() => {
				var scope_key = key;
				var hex = CustomTheme.data.colors[scope_key];
				var last_color = hex;
				var field = wrapper.find(`#color_field_${scope_key} .layout_color_preview`);

				field.spectrum({
					preferredFormat: "hex",
					color: hex,
					showAlpha: false,
					showInput: true,
					defaultColor: CustomTheme.defaultColors[key],
					resetText: tl('generic.reset'),
					cancelText: tl('dialog.cancel'),
					chooseText: tl('dialog.confirm'),
					move(c) {
						CustomTheme.data.colors[scope_key] = c.toHexString();
					},
					change(c) {
						last_color = c.toHexString();
					},
					hide(c) {
						CustomTheme.data.colors[scope_key] = last_color;
						field.spectrum('set', last_color);
					},
					beforeShow(a, b) {
						last_color = CustomTheme.data.colors[scope_key];
						field.spectrum('set', last_color);
					}
				});
			})()
		}
		CustomTheme.dialog_is_setup = true;
	},
	fetchFromStorage() {
		var legacy_colors = 0;
		var stored_theme = 0;
		try {
			if (localStorage.getItem('theme')) {
				stored_theme = JSON.parse(localStorage.getItem('theme'))
			}
			if (localStorage.getItem('app_colors')) {
				legacy_colors = JSON.parse(localStorage.getItem('app_colors'))
			}
		} catch (err) {}

		if (stored_theme) {
			for (var key in CustomTheme.data) {
				if (stored_theme[key] && typeof CustomTheme.data[key] !== 'object') {
					CustomTheme.data[key] = stored_theme[key];
				}
			}
		} else if (legacy_colors) {
			if (legacy_colors.main) {
				CustomTheme.data.main_font = legacy_colors.main.font;
			}
			if (legacy_colors.headline) {
				CustomTheme.data.headline_font = legacy_colors.headline.font;
			}
			if (legacy_colors.css) {
				CustomTheme.data.css = legacy_colors.css;
			}
		}
		for (var key in CustomTheme.defaultColors) {
			if (stored_theme && stored_theme.colors[key]) {
				CustomTheme.data.colors[key] = stored_theme.colors[key];
			} else if (legacy_colors && legacy_colors[key] && legacy_colors[key].hex) {
				CustomTheme.data.colors[key] = legacy_colors[key].hex;
			}
		}
		Blockbench.onUpdateTo('3.8', () => {
			if (CustomTheme.data.colors.checkerboard == '#2f3339') {
				CustomTheme.data.colors.checkerboard = CustomTheme.defaultColors.checkerboard;
			}
		})
		Blockbench.onUpdateTo('3.9', () => {
			if (CustomTheme.data.colors.selected == '#3c4456') {
				CustomTheme.data.colors.selected = CustomTheme.defaultColors.selected;
			}
		})
	},
	import(file) {
		var data = JSON.parse(file.content)
		var app = CustomTheme.data;
		if (pathToExtension(file.path) == 'bbstyle') {
			//legacy import
			if (data.main) app.main_font = data.main.font;
			if (data.headline) app.headline_font = data.headline.font;
			if (data.css) app.css = data.css;
			for (var key in app.colors) {
				if (data[key] && data[key].hex) {
					app.colors[key] = data[key].hex;
				}
			}
			if (data.text_acc) {
				app.colors.accent_text = data.text_acc
			}

		} else {
			if (data && data.colors) {
				Merge.string(app, data, 'main_font')
				Merge.string(app, data, 'headline_font')
				Merge.string(app, data, 'code_font')
				for (var key in app.colors) {
					Merge.string(app.colors, data.colors, key);
				}
				Merge.string(app, data, 'css')
			}
		}
	}
}


BARS.defineActions(function() {
	new Action('theme_window', {
		name: tl('dialog.settings.theme') + '...',
		icon: 'style',
		category: 'blockbench',
		click: function () {
			if (!CustomTheme.dialog_is_setup) CustomTheme.setupDialog()
			CustomTheme.dialog.show();
		}
	})
	new Action('import_theme', {
		icon: 'folder',
		category: 'blockbench',
		click: function () {
			Blockbench.import({
				resource_id: 'config',
				extensions: ['bbstyle', 'bbtheme'],
				type: 'Blockbench Theme'
			}, function(files) {
				CustomTheme.import(files[0]);
			})
		}
	})
	new Action('export_theme', {
		icon: 'style',
		category: 'blockbench',
		click: function () {
			Blockbench.export({
				resource_id: 'config',
				type: 'Blockbench Theme',
				extensions: ['bbtheme'],
				content: compileJSON(CustomTheme.data)
			})
		}
	})
	new Action('reset_theme', {
		icon: 'replay',
		category: 'blockbench',
		click() {
			var app = CustomTheme.data;
			app.main_font = '';
			app.headline_font = '';
			app.code_font = '';
			app.css = '';
			for (var key in app.colors) {
				Merge.string(app.colors, CustomTheme.defaultColors, key);
			}
		}
	})
	//Only interface
	new Action('reset_layout', {
		icon: 'replay',
		category: 'blockbench',
		click: function () {
			Interface.data = $.extend(true, {}, Interface.default_data)
			Interface.data.left_bar.forEach((id) => {
				$('#left_bar').append(Interface.Panels[id].node)
			})
			Interface.data.right_bar.forEach((id) => {
				$('#right_bar').append(Interface.Panels[id].node)
			})
			updateInterface()
		}
	})
	BarItems.import_theme.toElement('#layout_title_bar')
	BarItems.export_theme.toElement('#layout_title_bar')
	BarItems.reset_theme.toElement('#layout_title_bar')
})


onVueSetup(function() {

	CustomTheme.dialog = new Dialog({
		id: 'theme',
		title: 'dialog.settings.theme',
		singleButton: true,
		width: 920,
		title_menu: new Menu([
			'settings_window',
			'keybindings_window',
			'theme_window',
			'about_window',
		]),
		sidebar: {
			pages: {
				discover: 'Discover',
				color: 'Color Scheme',
				fonts: 'Fonts',
				css: 'Custom CSS'
			},
			page: 'discover',
			actions: [
				'import_theme',
				'export_theme',
				'reset_layout',
			],
			onPageSwitch(page) {
				CustomTheme.dialog.content_vue.open_category = page;
				CustomTheme.dialog.content_vue.search_term = '';
			}
		},
		component: {
			data() {return {
				open_category: 'discover',
				search_term: '',
			}},
			methods: {
				saveSettings() {
					Settings.saveLocalStorages();
				}
			},
			computed: {
				list() {
					if (this.search_term) {
						var keywords = this.search_term.replace(/_/g, ' ').split(' ');
						var items = {};
						for (var key in settings) {
							var setting = settings[key];
							if (Condition(setting.condition)) {
								var name = setting.name.toLowerCase();
								var desc = setting.description.toLowerCase();
								var missmatch = false;
								for (var word of keywords) {
									if (
										!key.includes(word) &&
										!name.includes(word) &&
										!desc.includes(word)
									) {
										missmatch = true;
									}
								}
								if (!missmatch) {
									items[key] = setting;
								}
							}
						}
						return items;
					} else {
						return this.structure[this.open_category].items;
					}
				},
				title() {
					if (this.search_term) {
						return tl('dialog.settings.search_results');
					} else {
						return this.structure[this.open_category].name;
					}
				}
			},
			template: `
				<div>
					<h2 class="i_b">${tl('dialog.settings.theme')}</h2>
					<div class="bar next_to_title" id="layout_title_bar"></div>
					<div class="y_scrollable" id="theme_editor">
						<div id="color_wrapper">
							<div class="color_field" v-for="(color, key) in colors" :id="'color_field_' + key">
								<div class="layout_color_preview" :style="{'background-color': color}" class="color_input"></div>
								<div class="desc">
									<h4>{{ tl('layout.color.'+key) }}</h4>
									<p>{{ tl('layout.color.'+key+'.desc') }}</p>
								</div>
							</div>
						</div>

						<div class="dialog_bar">
							<label class="name_space_left" for="layout_font_main">${tl('layout.font.main')}</label>
							<input style="font-family: var(--font-main)" type="text" class="half dark_bordered" id="layout_font_main" v-model="main_font">
						</div>

						<div class="dialog_bar">
							<label class="name_space_left" for="layout_font_headline">${tl('layout.font.headline')}</label>
							<input style="font-family: var(--font-headline)" type="text" class="half dark_bordered" id="layout_font_headline" v-model="headline_font">
						</div>
						<div class="dialog_bar">
							<label class="name_space_left" for="layout_font_cpde">${tl('layout.font.code')}</label>
							<input style="font-family: var(--font-code)" type="text" class="half dark_bordered" id="layout_font_cpde" v-model="code_font">
						</div>
						<h4 class="i_b">${tl('layout.css')}</h4>
						<div id="css_editor">
							<vue-prism-editor v-model="css" language="css" :line-numbers="true" />
						</div>

					</div>

				</div>`
		},
		onButton() {
			Settings.save();
		}
	})
})

