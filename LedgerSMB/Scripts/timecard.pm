=head1 NAME

LedgerSMB::Scripts::timecard - LedgerSMB workflow routines for timecards.

=head1 SYNPOSIS

 LedgerSMB::Scripts::timecard::display($request)

=head1 DESCRIPTION

This module contains the basic workflow scripts for managing timecards for 
LedgerSMB.  Timecards are used to track time and materials consumed in the 
process of work, from professional services to payroll and manufacturing.

=cut

package LedgerSMB::Scripts::timecard;
use LedgerSMB::Template;
use LedgerSMB::Timecard;
use LedgerSMB::Timecard::Type;
use LedgerSMB::Report::Timecards;
use LedgerSMB::Company_Config;
use LedgerSMB::Business_Unit_Class;
use LedgerSMB::Business_Unit;
use LedgerSMB::Setting;
use DateTime;

=head1 ROUTINES

=over

=item new

This begins the timecard workflow.  The following may be set as a default:

=over

=item business_unit_class

=item time_frame (1 for day, 7 for week)

=item date_from

=back

=cut

sub new {
    my ($request) = @_;
    @{$request->{bu_class_list}} = LedgerSMB::Business_Unit_Class->list();
    LedgerSMB::Template->new(
        user     => $request->{_user},
        locale   => $request->{_locale},
        path     => 'UI/timecards',
        template => 'entry_filter',
        format   => 'HTML'
    )->render($request);
}

=item display

Displays a timecard.  LedgerSMB::Timecard properties set are treated as 
defaults.

=cut

sub display {
    my ($request) = @_;
    $request->{non_billable} ||= 0;
    if ($request->{in_hour} and $request->{in_min}) {
        my $request->{min_used} = ($request->{in_hour} * 60) + $request->{in_min} - 
                                ($request->{out_hour} * 60) - $request->{out_min};
        $request->{qty} = $min_used/60 - $request->{non_billable};
    } else { # Default to current date and time
        my $now = DateTime->now;
        $request->{in_hour} = $now->hour unless defined $request->{in_hour};
        $request->{in_min} = $now->minute unless defined $request->{in_min};
    }
    @{$request->{b_units}} = LedgerSMB::Business_Unit->list(
          $request->{bu_class_id}, undef, 0, $request->{transdate}
    );
    my $curr = LedgerSMB::Setting->get('curr');
    @{$request->{currencies}} = split /:/, $curr;
    $request->{total} = $request->{qty} + $request->{non_billable};
     my $template = LedgerSMB::Template->new(
         user     => $request->{_user},
         locale   => $request->{_locale},
         path     => 'UI/timecards',
         template => 'timecard',
         format   => 'HTML'
     );
     $template->render($request);

}

=item timecard_screen

This displays a screen for entry of timecards, either single day or week.

=cut

sub timecard_screen {
    my ($request) = @_;
    if (1 == $request->{num_days}){
        $request->{transdate} = $request->{date_from};
        return display($request);
    } else {
         my $startdate = LedgerSMB::PGDate->from_input($request->{date_from});
         
         my @dates = ();
         for (0 .. 6){
            push @dates, LedgerSMB::PGDate->from_db(
                    $startdate->date->add(days => 1)->strftime('%Y-%m-%d'),
                    'date'
            );
         }
         $request->{num_lines} = 1 unless $request->{num_lines};
         $request->{transdates} = \@dates;
         my $template = LedgerSMB::Template->new(
             user     => $request->{_user},
             locale   => $request->{_locale},
             path     => 'UI/timecards',
             template => 'timecard-week',
             format   => 'HTML'
         );
         $template->render($request);
    }
}

=item save

=cut

sub save {
    my ($request) = @_;
    $request->{parts_id} =  LedgerSMB::Timecard->get_part_id(
           $request->{partnumber}
    );
    $request->{jctype} ||= 1;
    $request->{total} = $request->{qty} + $request{non_chargeable};
    my $timecard = LedgerSMB::Timecard->new(%$request);
    $timecard->save;
    $request->{id} = $timecard->id;
    $request->merge($timecard->get($request->{id}));
    display($request);
}

=item print

=cut

sub print {
    my ($request) = @_;
    my $timecard = LedgerSMB::Timecard->new(%$request);
    my $template = LedgerSMB::Template->new(
        user     => $request->{_user},
        locale   => $request->{_locale},
        path     => $LedgerSMB::Company_Config::settings->{templates},
        template => 'timecard',
        format   => $request->{format} || 'HTML'
    );
}

=item timecard_report

This generates a report of timecards.

=cut

sub timecard_report{
    my ($request) = @_;
    my $report = LedgerSMB::Report::Timecards->new(%$request);
    $report->render($request);
}

=item generate_order

This routine generates an order based on timecards

=cut

sub generate_order {
    my ($request) = @_;
    # TODO after beta 1
}


=back

=head1 SEE ALSO

=over

=item LedgerSMB::Timecard

=item LedgerSMB::Timecard::Type

=item LedgerSMB::Report::Timecards

=back

=head1 COPYRIGHT

COPYRIGHT (C) 2012 The LedgerSMB Core Team.  This file may be re-used under the
terms of the LedgerSMB General Public License version 2 or at your option any
later version.  Please see enclosed LICENSE file for details.

=cut

1;
