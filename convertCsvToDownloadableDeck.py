import sys
import csv
import json

csvname = sys.argv[1]
filename = csvname.replace(".csv", "")
deckname = csvname.replace(".csv",".txt")

deckObj = {}

with open(csvname, 'r') as f:
	r = csv.reader(f, delimiter="\t")
	lines = [line for line in r]
	# line 1: deck name
	deckObj['name'] = lines[0][0].strip()
	deckObj['file'] = filename
	# line 2: languages
	try:
		deckObj['front'] = lines[1][0].strip()
		deckObj['back'] = lines[1][1].strip()
	except IndexError:
		print("bad format in line 2 (should contain something like 'de', 'fr'")
	# then until the end: words
	cardsArray = []
	frontWords = set()
	backWords = set()
	for i in range(2, len(lines)):
		voc = lines[i]
		try:
			front = voc[0].strip()
			back = voc[1].strip()
			if front in (None, "") and back in (None, ""):
				continue
			cardObj = {"front": front, "back": back}
			cardsArray.append(cardObj)
			if front in frontWords:
				print("duplicate front |{0}| at line {1}".format(front, i+1))
			if back in backWords:
				print("duplicate back |{0}| at line {1}".format(back, i+1))
			frontWords.add(front)
			backWords.add(back)
		except IndexError:
			print("bad line: {0}".format(i+1))
	deckObj['cards'] = cardsArray

with open(deckname, 'w') as f:
	f.write(json.dumps(deckObj, indent=4))
