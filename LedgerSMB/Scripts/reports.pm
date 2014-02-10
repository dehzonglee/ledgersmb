=head1 NAME

LedgerSMB::Scripts::reports - Common Report workflows 

=head1 SYNOPSIS

This module holds common workflow routines for reports.

=head1 METHODS

=cut

package LedgerSMB::Scripts::reports;
our $VERSION = '1.0';

use LedgerSMB;
use LedgerSMB::Template;
use LedgerSMB::Business_Unit;
use LedgerSMB::Business_Unit_Class;
use LedgerSMB::Report::Balance_Sheet;
use LedgerSMB::Report::Listings::Business_Type;
use LedgerSMB::Report::Listings::GIFI;
use LedgerSMB::Report::Listings::Warehouse;
use LedgerSMB::Report::Listings::Language;
use LedgerSMB::Report::Listings::SIC;
use LedgerSMB::Report::Listings::Overpayments;
use strict;

=pod

=over

=item start_report

This displays the filter screen for the report.  It expects the following 
request properties to be set:

=over

=item report_name

This is the name of the report

=item module_name

Module name for the report.  This is used in retrieving business units.  If not
set, no business units are retrieved.

=back

Other variables that are set will be passed through to the underlying template.

=cut

sub start_report {
    my ($request) = @_;
    if ($request->{module_name}){
        $request->{class_id} = 0 unless $request->{class_id};
        $request->{control_code} = '' unless $request->{control_code};
        my $buc = LedgerSMB::Business_Unit_Class->new(%$request);
        my $bu = LedgerSMB::Business_Unit->new(%$request);
        @{$request->{bu_classes}} = $buc->list(1, $request->{module_name});
        for my $bc (@{$request->{bu_classes}}){
            @{$request->{b_units}->{$bc->{id}}}
                = $bu->list($bc->{id}, undef, 0, undef);
            for my $bu (@{$request->{b_units}->{$bc->{id}}}){
                $bu->{text} = $bu->control_code . ' -- '. $bu->description;
            }
        }
    }
    @{$request->{entity_classes}} = $request->call_procedure(
                      procname => 'entity__list_classes'
    );
    @{$request->{heading_list}} =  $request->call_procedure(
                      procname => 'account_heading_list');
    @{$request->{account_list}} =  $request->call_procedure(
                      procname => 'account__list_by_heading');
    @{$request->{batch_classes}} = $request->call_procedure(
                      procname => 'batch_list_classes'
    );
    @{$request->{all_years}} = $request->call_procedure(
              procname => 'date_get_all_years'
    );
    my $curr = LedgerSMB::Setting->get('curr');
    @{$request->{currencies}} = split ':', $curr;
    $_ = {id => $_, text => $_} for @{$request->{currencies}};
    my $months = LedgerSMB::App_State::all_months();
    $request->{all_months} = $months->{dropdown};
    if (!$request->{report_name}){
        die $request->{_locale}->text('No report specified');
    }
    @{$request->{country_list}} = $request->call_procedure( 
                   procname => 'location_list_country'
    );
    @{$request->{employees}} =  $request->call_procedure(
        procname => 'employee__all_salespeople'
    );
    my $template = LedgerSMB::Template->new(
        user => $request->{_user},
        locale => $request->{_locale},
        path => 'UI/Reports/filters',
        template => $request->{report_name},
        format => 'HTML'
    );
    $template->render($request);
}   

=item list_business_types 

Lists the business types.  No inputs expected or used.

=cut

sub list_business_types {
    my ($request) = @_;
    my $report = LedgerSMB::Report::Listings::Business_Type->new(%$request);
    $report->render($request);
}

=item list_gifi

List the gifi entries.  No inputs expected or used.

=cut

sub list_gifi {
    LedgerSMB::Report::Listings::GIFI->new()->render();
}

=item list_warehouse

List the warehouse entries.  No inputs expected or used.

=cut

sub list_warehouse {
    LedgerSMB::Report::Listings::Warehouse->new()->render();
}

=item list_language

List language entries.  No inputs expected or used.

=cut

sub list_language {
    LedgerSMB::Report::Listings::Language->new()->render();
}

=item list_sic

Lists sic codes

=cut

sub list_sic {
    LedgerSMB::Report::Listings::SIC->new->render;
}
    
=item balance_sheet 

Generates a balance sheet

=cut

sub balance_sheet {
    my ($request) = @_;
    $ENV{LSMB_ALWAYS_MONEY} = 1;
    my $report = LedgerSMB::Report::Balance_Sheet->new(%$request);
    $report->run_report;
    for my $count (1 .. 3){
        next unless $request->{"to_date_$count"};
        $request->{to_date} = $request->{"to_date_$count"};
        my $comparison = LedgerSMB::Report::Balance_Sheet->new(%$request);
        $comparison->run_report;
        $report->add_comparison($comparison);
    }
    $report->render($request);
}

=item search_overpayments

Searches overpayments based on inputs.

=cut

sub search_overpayments {
    my ($request) = @_;
    my $hiddens = {};
    $hiddens->{$_} = $request->{$_} for qw(batch_id currency exchangerate);
    $request->{hiddens} = $hiddens;
    LedgerSMB::Report::Listings::Overpayments->new(%$request)->render($request);
}

=back

=head1 Copyright (C) 2007 The LedgerSMB Core Team

Licensed under the GNU General Public License version 2 or later (at your 
option).  For more information please see the included LICENSE and COPYRIGHT 
files.

=cut

eval { require LedgerSMB::Scripts::custom::reports };
1;
