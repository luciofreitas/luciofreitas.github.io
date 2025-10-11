"""
Service for cataloging and filtering compatible automotive parts.

Run with:
  python src/parts_catalogs_service_v2.py

This module exposes several Flask endpoints and reads data from `parts_db.json` placed side-by-side with this file.
"""

import json
import os
import re
from flask import Flask, jsonify, request
from flask_cors import CORS


def load_parts_db(json_path=None):
	"""Load parts data from `parts_db.json` located next to this module.

	Returns an empty list if file not found.
	"""
	if json_path is None:
		base_dir = os.path.dirname(os.path.abspath(__file__))
		json_path = os.path.join(base_dir, "parts_db.json")
	if not os.path.exists(json_path):
		return []
	with open(json_path, encoding="utf-8") as f:
		return json.load(f)


PARTS_DB = load_parts_db()


def get_part_by_id(part_id):
	for part in PARTS_DB:
		if str(part.get("id")) == str(part_id):
			return part
	return None


def get_compatible_parts(part_id):
	original_part = get_part_by_id(part_id)
	if not original_part:
		return []

	original_category = original_part.get('category', '').lower()
	original_name = original_part.get('name', '').lower()

	compatible_parts = []
	for part in PARTS_DB:
		if str(part.get("id")) == str(part_id):
			continue
		part_category = part.get('category', '').lower()
		part_name = part.get('name', '').lower()

		is_compatible = False
		if original_category == 'filtros':
			# For filters, try to keep oil/air grouping logic
			if 'óleo' in original_name and 'óleo' in part_name:
				is_compatible = True
			elif 'ar' in original_name and 'ar' in part_name:
				is_compatible = True
			elif (
				'óleo' not in original_name and
				'ar' not in original_name and
				'óleo' not in part_name and
				'ar' not in part_name
			):
				is_compatible = True
		else:
			if part_category == original_category:
				is_compatible = True

		if is_compatible:
			compatible_parts.append(part)
	return compatible_parts


# --- Flask app and API ---
app = Flask(__name__)
CORS(app)


@app.route('/api/test', methods=['GET'])
def test():
	return jsonify({"status": "ok", "message": "Backend is running!"})


@app.route('/api/pecas/compatibilidade/<part_id>', methods=['GET'])
def compatibilidade(part_id):
	compatibles = get_compatible_parts(part_id)
	return jsonify({"compatibilidade": compatibles, "total": len(compatibles)})


def get_unique(field):
	return sorted(list({str(part.get(field, "")) for part in PARTS_DB if part.get(field)}))


@app.route('/api/pecas/filtrar', methods=['POST'])
def filtrar_pecas():
	data = request.get_json(force=True) or {}
	categoria = data.get('grupo', '').lower()
	peca = data.get('categoria', '').lower()
	marca = data.get('marca', '').lower()
	modelo = data.get('modelo', '').lower()
	ano = data.get('ano', '').lower()
	fabricante = data.get('fabricante', '').lower()

	if not any([categoria, peca, marca, modelo, ano, fabricante]):
		return jsonify({
			"pecas": [],
			"total": 0,
			"mensagem": "Selecione ao menos um filtro para buscar peças."
		})

	def matches(part):
		if categoria and part.get('category', '').lower() != categoria:
			return False
		if peca and part.get('name', '').lower() != peca:
			return False
		if fabricante and part.get('manufacturer', '').lower() != fabricante:
			return False

		if marca or modelo or ano:
			applications = part.get('applications', [])
			found = False
			for application in applications:
				app_str = str(application).lower()
				if marca and marca not in app_str:
					continue
				if modelo and modelo not in app_str:
					continue
				if ano:
					if ano != '':
						anos = []
						# String: extrai intervalos e anos
						if isinstance(application, str):
							matches_anos = re.findall(r'\d{4}(?:-\d{4})?', application)
							for str_ano in matches_anos:
								if '-' in str_ano:
									start, end = map(int, str_ano.split('-'))
									anos.extend([str(y) for y in range(start, end+1)])
								else:
									anos.append(str_ano)
						elif isinstance(application, dict) and 'years' in application:
							for str_ano in application['years']:
								if isinstance(str_ano, str) and '-' in str_ano:
									start, end = map(int, str_ano.split('-'))
									anos.extend([str(y) for y in range(start, end+1)])
								else:
									anos.append(str(str_ano))
						if ano not in anos:
							continue
				found = True
				break
			if not found:
				return False
		return True

	filtered = [part for part in PARTS_DB if matches(part)]
	return jsonify({"pecas": filtered, "total": len(filtered)})


@app.route('/api/pecas/categorias', methods=['GET'])
def categorias():
	return jsonify({"categorias": get_unique('category')})


@app.route('/api/pecas/marcas', methods=['GET'])
def marcas():
	brands = set()
	for part in PARTS_DB:
		for application in part.get('applications', []):
			if isinstance(application, str):
				brands.add(application.split()[0])
			elif isinstance(application, dict) and 'vehicle' in application:
				brands.add(application['vehicle'].split()[0])
	return jsonify({"marcas": sorted(list(brands))})


@app.route('/api/pecas/modelos', methods=['GET'])
def modelos():
	modelos_set = set()
	for part in PARTS_DB:
		for application in part.get('applications', []):
			if isinstance(application, str):
				tokens = application.split()
				if len(tokens) >= 2:
					if tokens[-1].isdigit() and len(tokens[-1]) == 4:
						modelos_set.add(' '.join(tokens[:-1]))
					elif '-' in tokens[-1]:
						modelos_set.add(' '.join(tokens[:-1]))
					else:
						modelos_set.add(' '.join(tokens))
			elif isinstance(application, dict) and 'vehicle' in application:
				modelos_set.add(application['vehicle'])
	return jsonify({"modelos": sorted(list(modelos_set))})


@app.route('/api/pecas/anos', methods=['GET'])
def anos():
	years = set()
	for part in PARTS_DB:
		for application in part.get('applications', []):
			if isinstance(application, str):
				found = re.findall(r'(\d{4})', application)
				years.update(found)
			elif isinstance(application, dict) and 'years' in application:
				years.update(str(y) for y in application['years'])
	return jsonify({"anos": sorted(list(years))})


@app.route('/api/pecas/fabricantes', methods=['GET'])
def fabricantes():
	return jsonify({"fabricantes": get_unique('manufacturer')})


@app.route('/api/pecas/todas', methods=['GET'])
def todas_pecas():
	return jsonify({"pecas": PARTS_DB})


if __name__ == "__main__":
	# Simple sanity check: ensure PARTS_DB loaded
	print(f"Loaded {len(PARTS_DB)} parts from parts_db.json")
	app.run(debug=True, port=5000)
