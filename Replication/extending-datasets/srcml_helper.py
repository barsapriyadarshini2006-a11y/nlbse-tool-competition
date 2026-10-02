from pylibsrcml import srcml
from lxml import etree
from typing import Tuple

class SrcMLHelper:

    def __init__(self):
        self.srcml_namespaces = { 'src': 'http://www.srcML.org/srcML/src'}

    def get_srcml_for(self, code, language='C++'):
        archive = srcml.srcml_archive()
        archive.write_open_memory()

        unit = srcml.srcml_unit(archive)
        unit.set_language(language)
        unit.parse_memory(code)
        
        archive.write_unit(unit)
        archive.close()
        return archive.srcML()
    
    def get_srcml_tree_for(self, code, language='C++') -> etree.Element:
        srcml_output = self.get_srcml_for(code, language)
        parser = etree.XMLParser(huge_tree=True)
        return etree.fromstring(bytes(bytearray(srcml_output, encoding='utf-8')), parser=parser)
    
    def get_code_for(self, srcml_xml: str) -> str:
        archive = srcml.srcml_archive()
        archive.read_open_memory(srcml_xml)

        unit = archive.read_unit()
        unit_src = None
        if unit is not None:
            unit.unparse_memory()
            unit_src = unit.src()
        
        archive.close()
        return unit_src
    
    def extract_comments(self, func_tree: etree.Element):
        return func_tree.xpath('.//src:comment/text()', namespaces=self.srcml_namespaces)
    
    def get_function(self, func_name: str, srcfile_content: str, language: str = 'C++'):
        srcfile_tree = self.get_srcml_tree_for(srcfile_content, language)

        srcfile_func = srcfile_tree.xpath('.//src:function/src:name[text()="{}"]/ancestor::src:function'.format(func_name), namespaces=self.srcml_namespaces)

        if len(srcfile_func) == 0:
            srcfile_func = srcfile_tree.xpath('.//src:macro/src:name[text()="{}"]/ancestor::src:macro'.format(func_name), namespaces=self.srcml_namespaces)
        
        if len(srcfile_func) == 0:
            srcfile_func = srcfile_tree.xpath('.//src:function/src:name/src:name[text()="{}"]/ancestor::src:function'.format(func_name), namespaces=self.srcml_namespaces)

        if len(srcfile_func) == 0:
            srcfile_func = srcfile_tree.xpath('.//src:constructor/src:name/src:name[text()="{}"]/ancestor::src:constructor'.format(func_name), namespaces=self.srcml_namespaces)

        if len(srcfile_func) == 0:
            srcfile_func = srcfile_tree.xpath('.//src:destructor/src:name/src:name[text()="{}"]/ancestor::src:destructor'.format(func_name), namespaces=self.srcml_namespaces)

        if len(srcfile_func) == 0:
            srcfile_func = srcfile_tree.xpath('.//src:destructor/src:name[text()="{}"]/ancestor::src:destructor'.format(func_name), namespaces=self.srcml_namespaces)

        if len(srcfile_func) == 0:
            srcfile_func = srcfile_tree.xpath('.//src:decl_stmt/src:decl/src:name[text()="{}"]/ancestor::src:decl_stmt'.format(func_name), namespaces=self.srcml_namespaces)

        return srcfile_func[0] if len(srcfile_func) > 0 else None

    def get_srcml_func_with_comments(self, srcfile_func) -> Tuple[str, bool, str]:
        func_element = srcfile_func
        previous_element = func_element.getprevious()
        srcfile_func_srcml = '<unit>'
        augmented = False
        leading_comment_srcml = None
        if previous_element is not None and 'comment' in previous_element.tag:
            print('INFO: LEADING COMMENT FOUND!!')
            augmented = True
            previous_element_srcml = etree.tostring(previous_element, encoding=str)
            srcfile_func_srcml += previous_element_srcml
            leading_comment_srcml = '<unit>' + previous_element_srcml + '</unit>'
        srcfile_func_srcml += etree.tostring(func_element, encoding=str)
        srcfile_func_srcml += '</unit>'
        return srcfile_func_srcml, augmented, leading_comment_srcml

    def get_function_name(self, original_func_tree) -> str:
        func_name = original_func_tree.xpath('.//src:function/src:name/text()', namespaces=self.srcml_namespaces)
        if len(func_name) == 0:
            func_name = original_func_tree.xpath('.//src:macro/src:name/text()', namespaces=self.srcml_namespaces)
        if len(func_name) == 0:
            func_name = original_func_tree.xpath('.//src:function/src:name/src:name/text()', namespaces=self.srcml_namespaces)
        if len(func_name) == 0:
            func_name = original_func_tree.xpath('.//src:constructor/src:name/src:name/text()', namespaces=self.srcml_namespaces)
        if len(func_name) == 0:
            func_name = original_func_tree.xpath('.//src:destructor/src:name/src:name/text()', namespaces=self.srcml_namespaces)
        if len(func_name) == 0:
            func_name = original_func_tree.xpath('.//src:destructor/src:name/text()', namespaces=self.srcml_namespaces)
        if len(func_name) == 0:
            func_name = original_func_tree.xpath('.//src:decl_stmt/src:decl/src:name/text()', namespaces=self.srcml_namespaces)

        if len(func_name) == 0:
            return None
        
        return func_name[0]