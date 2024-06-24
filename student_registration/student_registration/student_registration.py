"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
from web_fragments.fragment import Fragment
from xblock.core import XBlock


class StudentRegistrationXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    # TO-DO: delete count, and define your own fields.
    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the StudentRegistrationXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/student_registration.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/student_registration.css"))
        frag.add_javascript(self.resource_string("static/js/src/student_registration.js"))
        frag.initialize_js('StudentRegistrationXBlock')
        return frag
   

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("StudentRegistrationXBlock",
             """<student_registration/>
             """),
            ("Multiple StudentRegistrationXBlock",
             """<vertical_demo>
                <student_registration/>
                <student_registration/>
                <student_registration/>
                </vertical_demo>
             """),
        ]
