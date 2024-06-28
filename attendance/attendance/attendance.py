"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Integer, Scope
import logging

logger = logging.getLogger(__name__)

@XBlock.needs('user')
class AttendanceXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.
    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the AttendanceXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/attendance.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/attendance.css"))
        frag.add_javascript(self.resource_string("static/js/src/attendance.js"))
        frag.initialize_js('AttendanceXBlock')
        return frag
    @XBlock.json_handler
    def get_user_info(self, request, suffix=''):
        try:
            user =  self.runtime.service(self,'user')._django_user
        except Exception:
            # Handle the case where the user object does not exist
            logger.error("[Quiz Navigation] Error when get user info: User object not found")
        return {"user_info": { "id": user.id, "username": user.username, "email": user.email }}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("AttendanceXBlock",
             """<attendance/>
             """),
            ("Multiple AttendanceXBlock",
             """<vertical_demo>
                <attendance/>
                <attendance/>
                <attendance/>
                </vertical_demo>
             """),
        ]
