/**
 * Folked by Sean Bohan (PixelPicoSean) pixelpicosean@gmail.com
 */

/**
 * Copyright (c) 2012 Flyover Games, LLC
 *
 * Jason Andersen jgandersen@gmail.com
 * Isaac Burns isaacburns@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to
 * whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall
 * be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
 * KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * A JavaScript API for the Spriter SCON animation data format.
 */
ig.module(
    'plugins.spriter.spriter'
)
.defines(function() { 'use strict';

var spriter = spriter || {};
spriter.global = {};

// Type utils =======================================================
/**
 * @param {string} value
 * @param {boolean=} def
 * @return {boolean}
 */
spriter.toBool = function(value, def) {
    if (value !== undefined) {
        return 'true' === value ? true : false;
    }
    return def || false;
};

/**
 * @param {string} value
 * @param {number=} def
 * @return {number}
 */
spriter.toInt = function(value, def) {
    if (value !== undefined) {
        return parseInt(value, 10);
    }
    return def || 0;
};

/**
 * @param {string} value
 * @param {number=} def
 * @return {number}
 */
spriter.toFloat = function(value, def) {
    if (value !== undefined) {
        return parseFloat(value);
    }
    return def || 0.0;
};

/**
 * @param {string} value
 * @param {string=} def
 * @return {string}
 */
spriter.toString = function(value, def) {
    if (value !== undefined) {
        return value;
    }
    return def || '';
};

/**
 * @param {*} value
 * @param {Array=} def
 * @return {Array}
 */
spriter.toArray = function(value, def) {
    if (value) {
        if (value.length) {
            return value;
        }
        return [value];
    }

    return def || [];
};
// ==================================================================

// Tween utils ======================================================
/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @return {number}
 */
spriter.tween = function(a, b, t) {
    return a + ((b - a) * t);
};

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @param {number} spin
 * @return {number}
 */
spriter.tweenAngle = function(a, b, t, spin) {
    if ((spin > 0) && (a > b)) {
        return a + ((b + 360 - a) * t); // counter clockwise
    }
    else if ((spin < 0) && (a < b)) {
        return a + ((b - 360 - a) * t); // clockwise
    }
    return a + ((b - a) * t);
};
// ==================================================================

/**
 * @param {spriter.Bone|spriter.Object} bone
 * @param {spriter.Bone} parentBone
 * @return {void}
 */
spriter.combineParent = function(bone, parentBone) {
    bone.x *= parentBone.scale_x;
    bone.y *= parentBone.scale_y;

    var rad = parentBone.angle * Math.PI / 180;
    var rc = Math.cos(rad), rs = Math.sin(rad);
    var tx = bone.x, ty = bone.y;
    bone.x = tx * rc - ty * rs;
    bone.y = tx * rs + ty * rc;

    bone.x += parentBone.x;
    bone.y += parentBone.y;
    bone.angle += parentBone.angle;
    bone.scale_x *= parentBone.scale_x;
    bone.scale_y *= parentBone.scale_y;
};

// File =============================================================
/**
 * @constructor
 */
spriter.File = function() {
    this.id = -1;
    this.name = '';
    this.width = 0;
    this.height = 0;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.File}
 */
spriter.File.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.name = spriter.toString(json.name, '');
    this.width = spriter.toInt(json.width, 0);
    this.height = spriter.toInt(json.height, 0);
    return this;
};
// ==================================================================


// Folder ===========================================================
/**
 * @constructor
 */
spriter.Folder = function() {
    this.id = -1;
    this.file_array = null;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.Folder}
 */
spriter.Folder.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.file_array = [];
    json.file = spriter.toArray(json.file);
    for (var file_idx = 0, file_len = json.file.length; file_idx < file_len; ++file_idx) {
        this.file_array.push(new spriter.File().load(json.file[file_idx]));
    }

    return this;
};
// ==================================================================

// Bone =============================================================
/**
 * @constructor
 */
spriter.Bone = function() {
    this.id = -1;
    this.parent = -1;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.scale_x = 1;
    this.scale_y = 1;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.Bone}
 */
spriter.Bone.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.parent = spriter.toInt(json.parent, -1);
    this.x = spriter.toFloat(json.x, 0);
    this.y = spriter.toFloat(json.y, 0);
    this.angle = spriter.toFloat(json.angle, 0);
    this.scale_x = spriter.toFloat(json.scale_x, 1);
    this.scale_y = spriter.toFloat(json.scale_y, 1);
    return this;
};

/**
 * Create a bone with same properties of self
 * @param {spriter.Bone=} other
 * @return {spriter.Bone}
 */
spriter.Bone.prototype.clone = function(other) {
    return (other || new spriter.Bone()).copy(this);
};

/**
 * Copy properties from another bone
 * @param {spriter.Bone} other
 * @return {spriter.Bone}
 */
spriter.Bone.prototype.copy = function(other) {
    if (!other) { return; }

    this.id = other.id;
    this.parent = other.parent;
    this.x = other.x;
    this.y = other.y;
    this.angle = other.angle;
    this.scale_x = other.scale_x;
    this.scale_y = other.scale_y;
    return this;
};

/**
 * @param {spriter.Bone} other
 * @param {number} tween
 * @param {number} spin
 * @return {void}
 */
spriter.Bone.prototype.tween = function(other, tween, spin) {
    if (!other) { return; }

    this.x = spriter.tween(this.x, other.x, tween);
    this.y = spriter.tween(this.y, other.y, tween);
    this.angle = spriter.tweenAngle(this.angle, other.angle, tween, spin);
    this.scale_x = spriter.tween(this.scale_x, other.scale_x, tween);
    this.scale_y = spriter.tween(this.scale_y, other.scale_y, tween);
};
// ==================================================================

// BoneRef ==========================================================
/**
 * @constructor
 */
spriter.BoneRef = function() {
    this.id = -1;
    this.parent = -1;
    this.timeline = 0;
    this.key = 0;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.BoneRef}
 */
spriter.BoneRef.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.parent = spriter.toInt(json.parent, -1);
    this.timeline = spriter.toInt(json.timeline, 0);
    this.key = spriter.toInt(json.key, 0);
    return this;
};

/**
 * Create a clone of self
 * @param {spriter.BoneRef=} other
 * @return {spriter.BoneRef}
 */
spriter.BoneRef.prototype.clone = function(other) {
    return (other || new spriter.BoneRef()).copy(this);
};

/**
 * Copy properties from another instance
 * @param {spriter.BoneRef} other
 * @return {spriter.BoneRef}
 */
spriter.BoneRef.prototype.copy = function(other) {
    this.id = other.id;
    this.parent = other.parent;
    this.timeline = other.timeline;
    this.key = other.key;
    return this;
};
// ==================================================================

// Object ===========================================================
/**
 * @constructor
 */
spriter.Object = function() {
    this.id = -1;
    this.parent = -1;
    this.folder = 0;
    this.file = 0;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.scale_x = 1;
    this.scale_y = 1;
    this.pivot_x = 0;
    this.pivot_y = 1;
    this.z_index = 0;
    this.a = 1;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.Object}
 */
spriter.Object.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.parent = spriter.toInt(json.parent, -1);
    this.folder = spriter.toInt(json.folder, 0);
    this.file = spriter.toInt(json.file, 0);
    this.x = spriter.toFloat(json.x, 0);
    this.y = spriter.toFloat(json.y, 0);
    this.angle = spriter.toFloat(json.angle, 0);
    this.scale_x = spriter.toFloat(json.scale_x, 1);
    this.scale_y = spriter.toFloat(json.scale_y, 1);
    this.pivot_x = spriter.toFloat(json.pivot_x, 0);
    this.pivot_y = spriter.toFloat(json.pivot_y, 1);
    this.z_index = spriter.toInt(json.z_index, 0);
    this.a = spriter.toFloat(json.a, 1);
    return this;
};

/**
 * Create a clone of self
 * @param {spriter.Object=} other
 * @return {spriter.Object}
 */
spriter.Object.prototype.clone = function(other) {
    return (other || new spriter.Object()).copy(this);
};

/**
 * Copy properties from another instance
 * @return {spriter.Object}
 * @param {spriter.Object} other
 */
spriter.Object.prototype.copy = function(other) {
    this.id = other.id;
    this.parent = other.parent;
    this.folder = other.folder;
    this.file = other.file;
    this.x = other.x;
    this.y = other.y;
    this.angle = other.angle;
    this.scale_x = other.scale_x;
    this.scale_y = other.scale_y;
    this.pivot_x = other.pivot_x;
    this.pivot_y = other.pivot_y;
    this.z_index = other.z_index;
    this.a = other.a;
    return this;
};

/**
 * @param {spriter.Object} other
 * @param {number} tween
 * @param {number} spin
 * @return {void}
 */
spriter.Object.prototype.tween = function(other, tween, spin) {
    this.x = spriter.tween(this.x, other.x, tween);
    this.y = spriter.tween(this.y, other.y, tween);
    this.angle = spriter.tweenAngle(this.angle, other.angle, tween, spin);
    this.scale_x = spriter.tween(this.scale_x, other.scale_x, tween);
    this.scale_y = spriter.tween(this.scale_y, other.scale_y, tween);
    this.pivot_x = spriter.tween(this.pivot_x, other.pivot_x, tween);
    this.pivot_y = spriter.tween(this.pivot_y, other.pivot_y, tween);
    this.a = spriter.tween(this.a, other.a, tween);
};
// ==================================================================

// ObjectRef ========================================================
/**
 * @constructor
 */
spriter.ObjectRef = function() {
    this.id = -1;
    this.parent = -1;
    this.timeline = 0;
    this.key = 0;
    this.z_index = 0;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.ObjectRef}
 */
spriter.ObjectRef.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.parent = spriter.toInt(json.parent, -1);
    this.timeline = spriter.toInt(json.timeline, 0);
    this.key = spriter.toInt(json.key, 0);
    this.z_index = spriter.toInt(json.z_index, 0);
    return this;
};

/**
 * Create a clone of self
 * @param {spriter.ObjectRef=} other
 * @return {spriter.ObjectRef}
 */
spriter.ObjectRef.prototype.clone = function(other) {
    return (other || new spriter.ObjectRef()).copy(this);
};

/**
 * Copy properties from another instance
 * @param {spriter.ObjectRef} other
 * @return {spriter.ObjectRef}
 */
spriter.ObjectRef.prototype.copy = function(other) {
    this.id = other.id;
    this.parent = other.parent;
    this.timeline = other.timeline;
    this.key = other.key;
    this.z_index = other.z_index;
    return this;
};
// ==================================================================

// MainlineKey ======================================================
/**
 * @constructor
 */
spriter.MainlineKey = function() {
    this.id = -1;
    this.time = 0;
    this.bone_array = null;
    this.object_array = null;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.MainlineKey}
 */
spriter.MainlineKey.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.time = spriter.toInt(json.time, 0);

    // combine bones and bone_refs into one array and sort by id
    this.bone_array = [];
    json.bone = spriter.toArray(json.bone);
    for (var bone_idx = 0, bone_len = json.bone.length; bone_idx < bone_len; ++bone_idx) {
        this.bone_array.push(new spriter.Bone().load(json.bone[bone_idx]));
    }
    json.bone_ref = spriter.toArray(json.bone_ref);
    for (var bone_ref_idx = 0, bone_ref_len = json.bone_ref.length; bone_ref_idx < bone_ref_len; ++bone_ref_idx) {
        this.bone_array.push(new spriter.BoneRef().load(json.bone_ref[bone_ref_idx]));
    }
    this.bone_array.sort(function(a, b) { return a.id - b.id; });

    // combine objects and object_refs into one array and sort by id
    this.object_array = [];
    json.object = spriter.toArray(json.object);
    for (var object_idx = 0, object_len = json.object.length; object_idx < object_len; ++object_idx) {
        this.object_array.push(new spriter.Object().load(json.object[object_idx]));
    }
    json.object_ref = spriter.toArray(json.object_ref);
    for (var object_ref_idx = 0, object_ref_len = json.object_ref.length; object_ref_idx < object_ref_len; ++object_ref_idx) {
        this.object_array.push(new spriter.ObjectRef().load(json.object_ref[object_ref_idx]));
    }
    this.object_array.sort(function(a, b) { return a.id - b.id; });

    return this;
};
// ==================================================================

// Mainline =========================================================
/**
 * @constructor
 */
spriter.Mainline = function() {
    this.key_array = null;
};

/**
 * Initialize properites from json
 * @param {Object} json
 * @return {spriter.Mainline}
 */
spriter.Mainline.prototype.load = function(json) {
    this.key_array = [];
    json.key = spriter.toArray(json.key);
    for (var key_idx = 0, key_len = json.key.length; key_idx < key_len; ++key_idx) {
        this.key_array.push(new spriter.MainlineKey().load(json.key[key_idx]));
    }

    return this;
};
// ==================================================================

// TimelineKey ======================================================
/**
 * @constructor
 */
spriter.TimelineKey = function() {
    this.id = -1;
    this.time = 0;
    this.spin = 1; // 1: counter-clockwise, -1: clockwise
    this.bone = null;
    this.object = null;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.TimelineKey}
 */
spriter.TimelineKey.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.time = spriter.toInt(json.time, 0);
    this.spin = spriter.toInt(json.spin, 1);

    var bone = json.bone;
    // if bone is all defaults this happens
    if ((0 === bone) || (null === bone)) {
        bone = {};
    }
    if (bone) {
        this.bone = new spriter.Bone().load(bone);
    }

    var object = json.object;
    // if object is all defaults this happens
    if ((0 === object) || (null === object)) {
        object = {};
    }
    if (object) {
        this.object = new spriter.Object().load(object);
    }

    return this;
};
// ==================================================================

// Timeline =========================================================
/**
 * @constructor
 */
spriter.Timeline = function() {
    this.id = -1;
    this.name = '';
    this.key_array = null;
};

/**
 * @param {Object} json
 * @return {spriter.Timeline}
 */
spriter.Timeline.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.name = spriter.toString(json.name, '');

    this.key_array = [];
    json.key = spriter.toArray(json.key);
    for (var key_idx = 0, key_len = json.key.length; key_idx < key_len; ++key_idx) {
        this.key_array.push(new spriter.TimelineKey().load(json.key[key_idx]));
    }

    return this;
};
// ==================================================================

// Animation ========================================================
/**
 * @property id {number}
 * @property name {string} Name of this animation
 * @property length {number} Duration of the animation (time in ms)
 * @property looping {string} Loop type: "true", "false" or "ping_pong"
 * @property loop_to {number}
 * @property mainline {spriter.Mainline}
 * @property timeline_array {array}
 */

/**
 * @constructor
 */
spriter.Animation = function() {
    this.id = -1;
    this.name = '';
    this.length = 0;
    this.looping = 'true'; // "true", "false" or "ping_pong"
    this.loop_to = 0;
    this.mainline = null;
    this.timeline_array = null;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.Animation}
 */
spriter.Animation.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.name = spriter.toString(json.name, '');
    this.length = spriter.toInt(json.length, 0);
    this.looping = spriter.toString(json.looping, 'true');
    this.loop_to = spriter.toInt(json.loop_to, 0);

    json.mainline = json.mainline || {};
    this.mainline = new spriter.Mainline().load(json.mainline);

    this.timeline_array = [];
    json.timeline = spriter.toArray(json.timeline);
    for (var timeline_idx = 0, timeline_len = json.timeline.length; timeline_idx < timeline_len; ++timeline_idx) {
        this.timeline_array.push(new spriter.Timeline().load(json.timeline[timeline_idx]));
    }

    return this;
};
// ==================================================================

// Entity ===========================================================
/**
 * @constructor
 */
spriter.Entity = function() {
    this.id = -1;
    this.name = '';
    this.animation_array = null;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.Entity}
 */
spriter.Entity.prototype.load = function(json) {
    this.id = spriter.toInt(json.id, -1);
    this.name = spriter.toString(json.name, '');

    this.animation_array = [];
    json.animation = spriter.toArray(json.animation);
    for (var animation_idx = 0, animation_len = json.animation.length; animation_idx < animation_len; ++animation_idx) {
        this.animation_array.push(new spriter.Animation().load(json.animation[animation_idx]));
    }

    return this;
};
// ==================================================================

// Data =============================================================
/**
 * @constructor
 */
spriter.Data = function() {
    this.folder_array = null;
    this.entity_array = null;
};

/**
 * Initialize properties from json
 * @param {Object} json
 * @return {spriter.Data}
 */
spriter.Data.prototype.load = function(json) {
    this.folder_array = [];
    json.folder = spriter.toArray(json.folder);
    for (var folder_idx = 0, folder_len = json.folder.length; folder_idx < folder_len; ++folder_idx) {
        this.folder_array.push(new spriter.Folder().load(json.folder[folder_idx]));
    }

    this.entity_array = [];
    json.entity = spriter.toArray(json.entity);
    for (var entity_idx = 0; entity_idx < json.entity.length; ++entity_idx) {
        this.entity_array.push(new spriter.Entity().load(json.entity[entity_idx]));
    }

    return this;
};

/**
 * Parse scon JSON string into object and load
 * @param {string} scon JSON string which holds the data
 */
spriter.Data.prototype.parseSCON = function(scon) {
    // need some caching or something here
    var json_string = 0;

    if (spriter.global.sconContents !== undefined) {
        for (var i = 0; i < spriter.global.sconContents.length; i++) {
            if (spriter.global.sconContents[i].scon === scon) {
                json_string = spriter.global.sconContents[i].json_string;
            }
        }
    }

    if (json_string === 0) {
        if (spriter.global.sconContents === undefined) {
            spriter.global.sconContents = [];
        }
        var obj = {};
        obj.scon = scon;
        obj.json_string = scon;
        spriter.global.sconContents.push(obj);
    }

    var json = window.JSON.parse(scon);

    if (json) {
        this.load(json);
    }
};

/**
 * Initialize with scon file from a specific URL
 * @param {string} url Scon file url to be loaded
 * @param {function()} callback This will be invoked when finish loading
 */
spriter.Data.prototype.loadFromURL = function(url, callback) {
    var count = 0;
    var inc_count = function() { count++; };
    var dec_count = function() { if (--count === 0) { callback(); } };

    inc_count(); // url

    var req = this.importSCON(url);

    this.parseSCON(req);

    // load texture files from url

    var base_path = url.slice(0, url.lastIndexOf('/'));
    var folder_array = this.folder_array;
    for (var folder_idx = 0, folder_len = folder_array.length; folder_idx < folder_len; ++folder_idx) {
        var folder = folder_array[folder_idx];
        var file_array = folder.file_array;
        for (var file_idx = 0, file_len = file_array.length; file_idx < file_len; ++file_idx) {
            var file = file_array[file_idx];

            inc_count(); // texture_file
            file.image = new ig.Image(base_path + '/' + file.name);
        }
    }


    dec_count(); // url
    if (req.readyState === 4) {
        return;
    }
};

/**
 * Send request to get scon
 * @param {string} Scon file pathname
 * @return {string} JSON string loaded from the scon file
 */
spriter.Data.prototype.importSCON = function(sconFile) {
    if (!spriter.global.sconFiles) {
        spriter.global.sconFiles = [];
    }
    else {
        for (var i = 0; i < spriter.global.sconFiles.length; i++) {
            if (spriter.global.sconFiles[i].sconFile === sconFile) {
                return spriter.global.sconFiles[i].response;
            }
        }
    }

    var jsonDoc;
    var jsonLoaded = false;
    try {
        var fileRequest = new XMLHttpRequest();
        fileRequest.open('GET', sconFile, false);
    }
    catch (Exception) {
        var ie = (typeof window.ActiveXObject != 'undefined');

        if (ie) {
            jsonDoc = new ActiveXObject('Microsoft.XMLDOM');
            jsonDoc.async = false;
            while (jsonDoc.readyState != 4) {}
            jsonDoc.load(sconFile);
            //readXML();
            jsonLoaded = true;
            return jsonDoc;
        }
        else {
            jsonDoc = document.implementation.createDocument('', '', null);
            jsonDoc.onload = readXML;
            jsonDoc.load(sconFile);
            jsonLoaded = true;
            return jsonDoc;
        }
    }

    if (!jsonLoaded) {
        fileRequest.setRequestHeader('Content-Type', 'text/json');
        fileRequest.send('');

        var obj = {};
        obj.sconFile = sconFile;
        obj.response = fileRequest.responseText;
        spriter.global.sconFiles.push(obj);

        jsonDoc = fileRequest.responseText;
        jsonLoaded = true;
        return jsonDoc;
    }
};

/**
 * @param {File} input_file
 * @param {FileList} input_files
 * @param {function()} callback
 */
spriter.Data.prototype.loadFromFileList = function(input_file, input_files, callback) {
    var that = this;

    var count = 0;
    var inc_count = function() { count++; };
    var dec_count = function() { if (--count == 0) { callback(); } };

    inc_count(); // input_file

    var file_reader = new FileReader();
    file_reader.addEventListener('load', function(e) {
        that.parseSCON(e.target.result);

        // load texture files from file list

        var find_file = function(input_files, texture_name) {
            var name = texture_name.toLowerCase() + '$'; // match at end of line only
            for (var idx = 0, len = input_files.length; idx < len; ++idx) {
                var input_file = input_files[idx];
                input_file.webkitRelativePath = input_file.webkitRelativePath || '';
                var path = input_file.webkitRelativePath;
                if (path && path.toLowerCase().match(name)) {
                    return input_file;
                }
            }
            return null;
        };

        var folder_array = that.folder_array;
        for (var folder_idx = 0, folder_len = folder_array.length; folder_idx < folder_len; ++folder_idx) {
            var folder = folder_array[folder_idx];
            var file_array = folder.file_array;
            for (var file_idx = 0, file_len = file_array.length; file_idx < file_len; ++file_idx) {
                var file = file_array[file_idx];
                var texture_file = find_file(input_files, file.name);
                if (texture_file) {
                    inc_count(); // texture_file
                    var texture_file_reader = new FileReader();
                    texture_file_reader.addEventListener('load', (function(file) { return function(e) {
                        var image = file.image = new Image();
                        image.hidden = true;
                        image.addEventListener('load', function(e) {
                            file.width = file.width || e.target.width;
                            file.height = file.height || e.target.height;
                            e.target.hidden = false;
                            dec_count(); // texture_file
                        },
                        false);
                        image.addEventListener('error', function(e) { dec_count(); }, false); // texture_file
                        image.addEventListener('abort', function(e) { dec_count(); }, false); // texture_file
                        image.src = e.target.result;
                    };
                    })(file), false);
                    texture_file_reader.readAsDataURL(texture_file);
                }
            }
        }

        dec_count(); // input_file
    },
    false);
    file_reader.readAsText(input_file);
};

/**
 * @param {FileEntry} entry
 * @param {function()} callback
 * @return {void}
 */
spriter.Data.prototype.loadFromFileEntry = function(entry, callback) {
    var that = this;

    var count = 0;
    var inc_count = function() { count++; };
    var dec_count = function() { if (--count == 0) { callback(); } };

    inc_count(); // entry

    entry.file(function(file) {
        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            that.parseSCON(e.target.result);

            // load textures from file entry filesystem root

            var folder_array = that.folder_array;
            for (var folder_idx = 0, folder_len = folder_array.length; folder_idx < folder_len; ++folder_idx) {
                var folder = folder_array[folder_idx];
                var file_array = folder.file_array;
                for (var file_idx = 0, file_len = file_array.length; file_idx < file_len; ++file_idx) {
                    var file = file_array[file_idx];
                    inc_count(); // texture_entry
                    entry.filesystem.root.getFile(file.name, {},
                    (function(file) { return function(texture_entry) {
                        inc_count(); // texture_file
                        texture_entry.file(function(texture_file) {
                            var texture_file_reader = new FileReader();
                            texture_file_reader.addEventListener('load', function(e) {
                                var image = file.image = new Image();
                                image.hidden = true;
                                image.addEventListener('load', function(e) {
                                    file.width = file.width || e.target.width;
                                    file.height = file.height || e.target.height;
                                    e.target.hidden = false;
                                    dec_count(); // texture_file
                                },
                                false);
                                image.addEventListener('error', function(e) { dec_count(); }, false); // texture_file
                                image.addEventListener('abort', function(e) { dec_count(); }, false); // texture_file
                                image.src = e.target.result;
                            },
                            false);
                            texture_file_reader.readAsDataURL(texture_file);
                        },
                        function() {
                            dec_count(); // texture_file
                        });
                        dec_count(); // texture_entry
                    };
                    })(file),
                    (function(file) { return function(e) {
                        window.console.log('error code: ' + e.code + ', could not load texture: ' + file.name);
                        dec_count(); // texture_entry
                    };
                    })(file));
                }
            }
            dec_count(); // entry
        },
        false);
        reader.readAsText(file);
    });
};

/**
 * @return {number}
 */
spriter.Data.prototype.getNumEntities = function() {
    var entity_array = this.entity_array;
    if (entity_array) {
        return entity_array.length;
    }
    return 0;
};

/**
 * @param {number} entity_index
 * @return {string}
 */
spriter.Data.prototype.getEntityName = function(entity_index) {
    var entity_array = this.entity_array;
    if (entity_array && (entity_index < entity_array.length)) {
        var entity = entity_array[entity_index];
        return entity.name;
    }
    return '';
};

/**
 * @param {number} entity_index
 * @return {number}
 */
spriter.Data.prototype.getNumAnims = function(entity_index) {
    var entity_array = this.entity_array;
    if (entity_array && (entity_index < entity_array.length)) {
        var entity = entity_array[entity_index];
        var animation_array = entity.animation_array;
        if (animation_array) {
            return animation_array.length;
        }
    }
    return 0;
};

/**
 * @param {number} entity_index
 * @param {number} anim_index
 * @return {string}
 */
spriter.Data.prototype.getAnimName = function(entity_index, anim_index) {
    var entity_array = this.entity_array;
    if (entity_array && (entity_index < entity_array.length)) {
        var entity = entity_array[entity_index];
        var animation_array = entity.animation_array;
        if (animation_array && (anim_index < animation_array.length)) {
            var anim = animation_array[anim_index];
            return anim.name;
        }
    }
    return '';
};

/**
 * @param {number} entity_index
 * @param {number} anim_index
 * @return {number}
 */
spriter.Data.prototype.getAnimLength = function(entity_index, anim_index) {
    var entity_array = this.entity_array;
    if (entity_array && (entity_index < entity_array.length)) {
        var entity = entity_array[entity_index];
        var animation_array = entity.animation_array;
        if (animation_array && (anim_index < animation_array.length)) {
            var anim = animation_array[anim_index];
            return anim.length;
        }
    }
    return -1;
};

/**
 * @param {number} entity_index
 * @param {number} anim_index
 * @return {number}
 */
spriter.Data.prototype.getNumAnimKeys = function(entity_index, anim_index) {
    var entity_array = this.entity_array;
    if (entity_array && (entity_index < entity_array.length)) {
        var entity = entity_array[entity_index];
        var animation_array = entity.animation_array;
        if (animation_array && (anim_index < animation_array.length)) {
            var anim = animation_array[anim_index];
            return anim.mainline.key_array.length;
        }
    }
    return 0;
};

/**
 * @param {number} entity_index
 * @param {number} anim_index
 * @param {number} key_index
 * @return {number}
 */
spriter.Data.prototype.getAnimKeyTime = function(entity_index, anim_index, key_index) {
    var entity_array = this.entity_array;
    if (entity_array && (entity_index < entity_array.length)) {
        var entity = entity_array[entity_index];
        var animation_array = entity.animation_array;
        if (animation_array && (anim_index < animation_array.length)) {
            var anim = animation_array[anim_index];
            var key_array = anim.mainline.key_array;
            if (key_array && (key_index < key_array.length)) {
                return key_array[key_index].time;
            }
        }
    }
    return 0;
};

/**
 * @constructor
 * @param {spriter.Data=} data
 */
spriter.Pose = function(data) {
    this.m_data = data || null;

    this.m_entity_index = 0;
    this.m_anim_index = 0;
    this.m_time = 0;

    /** @type {number} how many times the animation looped */
    this.loopCount = 0;

    this.m_dirty = true;

    this.m_mainline_key_index = 0;

    this.m_tweened_bone_array = [];
    this.m_tweened_object_array = [];
};

/**
 * @return {number}
 */
spriter.Pose.prototype.getNumEntities = function() {
    if (this.m_data) {
        return this.m_data.getNumEntities();
    }

    return 0;
};

/**
 * @return {number}
 */
spriter.Pose.prototype.getEntity = function() {
    return this.m_entity_index;
};

/**
 * @param {number|string} entity_id
 * @return {void}
 */
spriter.Pose.prototype.setEntity = function(entity_id) {
    var num_entities = this.getNumEntities();

    if (isFinite(entity_id)) {
        // set entity by index
        if (entity_id < num_entities) {
            this.m_entity_index = /** @type {number} */ entity_id;
            this.m_anim_index = 0;
            this.m_time = 0;
            this.m_dirty = true;
        }
    }
    else {
        // set entity by name
        for (var entity_idx = 0; entity_idx < num_entities; ++entity_idx) {
            if (entity_id == this.getEntityName(entity_idx)) {
                this.m_entity_index = entity_idx;
                this.m_anim_index = 0;
                this.m_time = 0;
                this.m_dirty = true;
                break;
            }
        }
    }
};

/**
 * @param {number=} entity_index
 * @return {string}
 */
spriter.Pose.prototype.getEntityName = function(entity_index) {
    entity_index = (entity_index !== undefined) ? (entity_index) : (this.m_entity_index);
    if (this.m_data) {
        return this.m_data.getEntityName(entity_index);
    }
    return '';
};

/**
 * @param {number=} entity_index
 * @return {number}
 */
spriter.Pose.prototype.getNumAnims = function(entity_index) {
    entity_index = (entity_index !== undefined) ? (entity_index) : (this.m_entity_index);
    if (this.m_data) {
        return this.m_data.getNumAnims(entity_index);
    }
    return 0;
};

/**
 * @return {number}
 */
spriter.Pose.prototype.getAnim = function() {
    return this.m_anim_index;
};

/**
 * @param {number|string} anim_id
 * @return {void}
 */
spriter.Pose.prototype.setAnim = function(anim_id) {
    var result = false;
    if (isFinite(anim_id)) {
        // set animation by index
        if ((0 <= anim_id) && (anim_id < this.getNumAnims())) {
            this.m_anim_index = /** @type {number} */ anim_id;
            this.m_time = 0;
            this.m_dirty = true;
            result = true;
        }
    }
    else {
        // set animation by name
        for (var anim_idx = 0, anim_len = this.getNumAnims(); anim_idx < anim_len; ++anim_idx) {
            if (anim_id == this.getAnimName(anim_idx)) {
                this.m_anim_index = anim_idx;
                this.m_time = 0;
                this.m_dirty = true;
                result = true;
                break;
            }
        }
        if (!result) console.log('<Spriter>: [WARNING] Animation "' + anim_id + '" not found!');
    }
    this.loopCount = 0;
};

/**
 * @return {void}
 */
spriter.Pose.prototype.setNextAnim = function() {
    var num_anims = this.getNumAnims();
    if (num_anims > 1) {
        this.setAnim((this.getAnim() + 1) % num_anims);
    }
};

/**
 * @return {void}
 */
spriter.Pose.prototype.setPrevAnim = function() {
    var num_anims = this.getNumAnims();
    if (num_anims > 1) {
        this.setAnim((this.getAnim() + num_anims - 1) % num_anims);
    }
};

/**
 * @param {number=} anim_index
 * @return {string}
 */
spriter.Pose.prototype.getAnimName = function(anim_index) {
    var entity_index = this.m_entity_index;
    anim_index = (anim_index !== undefined) ? (anim_index) : (this.m_anim_index);
    if (this.m_data) {
        return this.m_data.getAnimName(entity_index, anim_index);
    }
    return '';
};

/**
 * @param {number=} anim_index
 * @return {number}
 */
spriter.Pose.prototype.getAnimLength = function(anim_index) {
    var entity_index = this.m_entity_index;
    anim_index = (anim_index !== undefined) ? (anim_index) : (this.m_anim_index);
    if (this.m_data) {
        return this.m_data.getAnimLength(entity_index, anim_index);
    }
    return -1;
};

/**
 * @param {number=} anim_index
 * @return {number}
 */
spriter.Pose.prototype.getNumAnimKeys = function(anim_index) {
    var entity_index = this.m_entity_index;
    anim_index = (anim_index !== undefined) ? (anim_index) : (this.m_anim_index);
    if (this.m_data) {
        return this.m_data.getNumAnimKeys(entity_index, anim_index);
    }
    return 0;
};

/**
 * @param {number=} anim_index
 * @return {number}
 */
spriter.Pose.prototype.getAnimKeyTime = function(anim_index, key_index) {
    var entity_index = this.m_entity_index;
    anim_index = (anim_index !== undefined) ? (anim_index) : (this.m_anim_index);
    if (this.m_data) {
        return this.m_data.getAnimKeyTime(entity_index, anim_index, key_index);
    }
    return 0;
};

/**
 * @param {number=} anim_index
 * @return {number}
 */
spriter.Pose.prototype.getNumAnimKeys = function(anim_index) {
    var entity_index = this.m_entity_index;
    anim_index = (anim_index !== undefined) ? (anim_index) : (this.m_anim_index);
    if (this.m_data) {
        return this.m_data.getNumAnimKeys(entity_index, anim_index);
    }
    return 0;
};

/**
 * @param {number=} anim_index
 * @param {number=} key_index
 * @return {number}
 */
spriter.Pose.prototype.getAnimKeyTime = function(anim_index, key_index) {
    var entity_index = this.m_entity_index;
    anim_index = (anim_index !== undefined) ? (anim_index) : (this.m_anim_index);
    key_index = (key_index !== undefined) ? (key_index) : (this.m_mainline_key_index);
    if (this.m_data) {
        return this.m_data.getAnimKeyTime(entity_index, anim_index, key_index);
    }
    return 0;
};

/**
 * @return {number}
 */
spriter.Pose.prototype.getTime = function() {
    return this.m_time;
};

/**
 * @param {number} time
 * @return {void}
 */
spriter.Pose.prototype.setTime = function(time) {
    if (this.m_time != time) {
        this.m_time = time;
        this.m_dirty = true;
    }
};

/**
 * @return {number}
 */
spriter.Pose.prototype.getKey = function() {
    return this.m_mainline_key_index;
};

/**
 * @param {number} key_index
 * @return {void}
 */
spriter.Pose.prototype.setKey = function(key_index) {
    if (this.m_mainline_key_index != key_index) {
        this.m_time = this.getAnimKeyTime(this.m_anim_index, key_index);
        this.m_dirty = true;
    }
};

/**
 * @param {number} elapsed_time
 * @return {void}
 */
spriter.Pose.prototype.update = function(elapsed_time) {
    var anim_length = this.getAnimLength();

    if (anim_length > 0) {
        this.m_time += elapsed_time;

        if (this.m_time < 0 || this.m_time >= anim_length) {
            this.loopCount++;
        }

        // while (this.m_time < 0) {
        //  this.m_time += anim_length;
        // }
        // while (this.m_time >= anim_length) {
        //  this.m_time -= anim_length;
        // }

        if (this.m_time < 0 || this.m_time >= anim_length) {
            this.m_time = 0;
        }

        this.m_dirty = true;
    }
};

/**
 * @return {void}
 */
spriter.Pose.prototype.strike = function() {
    if (!this.m_dirty) { return; }
    this.m_dirty = false;

    if (this.m_data && this.m_data.entity_array) {
        var entity_array = this.m_data.entity_array;
        var entity = entity_array[this.m_entity_index];
        var animation_array = entity.animation_array;
        var animation = animation_array[this.m_anim_index];
        var mainline = animation.mainline;
        var mainline_key_array = mainline.key_array;

        // find key frame based on requested time
        var tween_time = this.m_time;
        var mainline_key_index = 0, len = mainline_key_array.length;
        for (; mainline_key_index < len; ++mainline_key_index) {
            var mainline_key = mainline_key_array[mainline_key_index];
            if (tween_time < mainline_key.time) { break; }
        }
        if (mainline_key_index > 0) { mainline_key_index--; } // back up one
        this.m_mainline_key_index = mainline_key_index;

        var mainline_key = mainline_key_array[this.m_mainline_key_index];
        var timeline_array = animation.timeline_array;

        var bone_array = mainline_key.bone_array;
        var tweened_bone_array = this.m_tweened_bone_array;

        for (var bone_idx = 0, bone_len = bone_array.length; bone_idx < bone_len; ++bone_idx) {
            var tweened_bone = tweened_bone_array[bone_idx] = (tweened_bone_array[bone_idx] || new spriter.Bone());

            var bone = bone_array[bone_idx];
            var timeline_index = bone.timeline;

            if (timeline_index !== undefined) {
                // bone is a spriter.BoneRef, dereference
                var key_index = bone.key;
                var timeline = timeline_array[timeline_index];
                var timeline_key_array = timeline.key_array;
                var timeline_key = timeline_key_array[key_index];

                var time1 = timeline_key.time;
                var bone1 = timeline_key.bone;
                tweened_bone.copy(bone1);
                tweened_bone.parent = bone.parent; // set parent from bone_ref

                // see if there's something to tween with
                var timeline_key2 = timeline_key_array[key_index + 1];
                if (timeline_key2 !== undefined) {
                    var time2 = timeline_key2.time;
                    var bone2 = timeline_key2.bone;
                    var tween = (tween_time - time1) / (time2 - time1);
                    tweened_bone.tween(bone2, tween, timeline_key.spin);
                }
            }
            else {
                // bone is a spriter.Bone, copy
                bone = /** @type {spriter.Bone} */ bone;
                tweened_bone.copy(bone);
            }

            // see if there's a parent transform
            var parent_index = bone.parent;
            if (parent_index >= 0) {
                spriter.combineParent(tweened_bone, tweened_bone_array[parent_index]);
            }
        }

        // clamp output bone array
        if (tweened_bone_array.length > bone_array.length) {
            tweened_bone_array.length = bone_array.length;
        }

        var object_array = mainline_key.object_array;
        var tweened_object_array = this.m_tweened_object_array;

        for (var object_idx = 0, object_len = object_array.length; object_idx < object_len; ++object_idx) {
            var tweened_object = tweened_object_array[object_idx] = (tweened_object_array[object_idx] || new spriter.Object());

            var object = object_array[object_idx];
            var timeline_index = object.timeline;

            if (timeline_index !== undefined) {
                // object is a spriter.ObjectRef, dereference
                var key_index = object.key;
                var timeline = timeline_array[timeline_index];
                var timeline_key_array = timeline.key_array;
                var timeline_key = timeline_key_array[key_index];

                var time1 = timeline_key.time;
                var object1 = timeline_key.object;
                tweened_object.copy(object1);
                tweened_object.parent = object.parent; // set parent from object_ref

                // see if there's something to tween with
                var timeline_key2 = timeline_key_array[key_index + 1];
                if (timeline_key2 !== undefined) {
                    var time2 = timeline_key2.time;
                    var object2 = timeline_key2.object;
                    var tween = (tween_time - time1) / (time2 - time1);
                    tweened_object.tween(object2, tween, timeline_key.spin);
                }
            }
            else {
                // object is a spriter.Object, copy
                object = /** @type {spriter.Object} */ object;
                tweened_object.copy(object);
            }

            // see if there's a parent transform
            var parent_index = object.parent;
            if (parent_index >= 0) {
                spriter.combineParent(tweened_object, tweened_bone_array[parent_index]);
            }
        }

        // clamp output object array
        if (tweened_object_array.length > object_array.length) {
            tweened_object_array.length = object_array.length;
        }
    }
};

// module definition
ig.spriter = spriter;

});
