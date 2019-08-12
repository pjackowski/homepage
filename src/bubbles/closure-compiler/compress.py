"""Script replaces and compresses names of functions, variables and members in
   diagram's code. It is supposed to improve compression ratio of JS output file
   from Google's closure compiler (simple compression). Their advanced compression
   seems to be much better, however it is very aggressive and therefore difficult
   to use. That is why I decided to use safe simple compression and apply my custom
   replace script."""

"""Closure compiler command:
    java -jar closure-compiler.jar --js diagram.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file diagram-minified.js"""

"""Usage:
    Just run this script and make sure file names are correct."""

import hashlib

file_in= 'diagram.js'
file_out= '../js/diagram-min.js'

string_dict= {
    'raphContainer': 'rc',
    'var Vector=': 'H=',
    'addVector': 'eco',
    'subVector': 'bus',
    'new Vector': 'new H',
    'Spring=': 'FS=',
    'new Spring': 'new FS',
    'Spring.': 'FS.',
    'Bubble=': 'SF=',
    'new Bubble': 'new SF',
    'Bubble.': 'SF.',
    'getSpringArr': 'gbz',
    'getDistance': 'tnc',
    'getLength': 'let',
    'getNormalized': 'rol',
    'getMultiplied': 'tud',
    'getRotated': 'eta',
    'getScalarProduct': 'uor',
    'getCrossProduct': 'ssr',
    'hookeAttraction': 'ooa',
    'applyZoom': 'moz',
    'highlight': 'hog',
    'darklight': 'goh',
    'showLabel': 'lla',
    'hideLabel': 'aal',
    'getKineticEnergy': 'gkc',
    'coulombRepulsion': 'mol',
    'testCollision': 'sin',
    'avoidInitialCollision': 'voi',
    'resolveSingleCollision': 'sol',
    'applyGravity': 'ppl',
    'rotate': 'tat',
    'doesSpringExist': 'exi',
    'addSpring': 'dsp',
    'applyDefaultStyle': 'def',
    'doOnMouseOver': 'mor',
    'doOnMouseOut': 'mse',
    'updateLabelPosition': 'day',
    'showQuickLabel': 'klc',
    'hideQuickLabel': 'ide',
    'updateQuickLabelPosition': 'sac',
    'getBubbleArr': 'ret',
    'mergeParameters': 'ter',
    'loadData': 'tao',
    'setMinAndMax': 'inx',
    'getConvertedValue': 'rve',
    'getRandomPosition': 'ndo',
    'getRelatedPosition': 'lat',
    'getGeometricMassCenter': 'cii',
    'doesBubbleExist': 'esx',
    'createBubbles': 'bbr',
    'createRelatedBubbles': 'eca',
    'createBubble': 'ntl',
    'createSpring': 'sic',
    'translateChart': 'nns',
    'rotateChart': 'juy',
    'zoomChart': 'yre',
    'centerChart': 'hat',
    'resolveChart': 'ver',
    'setupOnMouseDownHandler': 'wno',
    'setupOnMouseMoveHandler': 'evo',
    'setupOnMouseUpHandler': 'uup',
    'setupOnMouseOutHandler': 'uts',
    'setupOnMouseWheelHandler': 'hde',
}

print('Opening file: %(file_name)s' % {'file_name': file_in})

text_file= open(file_in, "r")
content= text_file.read()
text_file.close()

for k, v in string_dict.items():
    hash_before = hashlib.md5(content)
    content= content.replace(k, v)
    hash_after = hashlib.md5(content)

    if hash_before.hexdigest() == hash_after.hexdigest():
        msg = 'not found!'
    else:
        msg = 'ok   '

    output = {'in': k, 'out': v, 'msg': msg }
    print('Replacing: %(in)s, with: %(out)s, %(msg)s' % output)

print('Saving changes: %(file_name)s' % {'file_name': file_out})

text_file= open(file_out, "w")
text_file.write(content)
text_file.close()

print('Done')
