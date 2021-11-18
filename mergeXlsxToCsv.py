import sys
import pandas

xlsxfile = sys.argv[1]
xlsx = pandas.ExcelFile(xlsxfile)
sheets = [pandas.read_excel(xlsx, sheet, header=None) for sheet in xlsx.sheet_names]
joined = pandas.concat(sheets)
csvfile = xlsxfile.replace('.xlsx', '.csv')
joined.to_csv(csvfile, sep='\t', index=False, header=False)
